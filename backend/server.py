from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Union, Any
import uuid
from datetime import datetime
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Vorprozess Regelwerk API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums for better type safety
class FieldType(str, Enum):
    TEXT = "text"
    SELECT = "select"
    DOCUMENT = "document"

class FieldVisibility(str, Enum):
    VISIBLE = "visible"
    EDITABLE = "editable"

class FieldRequirement(str, Enum):
    OPTIONAL = "optional"
    REQUIRED = "required"

class DocumentMode(str, Enum):
    DOWNLOAD_ONLY = "download"
    DOWNLOAD_UPLOAD = "download_upload"
    DOWNLOAD_METADATA_UPLOAD = "download_metadata_upload"
    UPLOAD_ONLY = "upload"

class SelectType(str, Enum):
    RADIO = "radio"
    MULTIPLE = "multiple"

class UserRole(str, Enum):
    ANMELDER = "anmelder"
    KLIENT = "klient"
    ADMIN = "admin"

class Language(str, Enum):
    DE = "de"
    FR = "fr"
    IT = "it"

# Base Models
class MultiLanguageText(BaseModel):
    de: str
    fr: str
    it: str

class FieldDependency(BaseModel):
    field_id: str
    condition_value: Union[str, List[str]]
    operator: str = "equals"  # equals, in, not_equals

class DocumentConstraints(BaseModel):
    max_size_mb: Optional[float] = None
    allowed_formats: Optional[List[str]] = None  # ["pdf", "doc", "docx"]

class SelectOption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: MultiLanguageText
    value: str

class FieldValidation(BaseModel):
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    pattern: Optional[str] = None  # regex pattern
    date_format: Optional[str] = None

# Core Models
class Field(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: MultiLanguageText
    type: FieldType
    visibility: FieldVisibility = FieldVisibility.EDITABLE
    requirement: FieldRequirement = FieldRequirement.OPTIONAL
    
    # For text fields
    validation: Optional[FieldValidation] = None
    
    # For select fields
    select_type: Optional[SelectType] = None
    options: Optional[List[SelectOption]] = None
    
    # For document fields
    document_mode: Optional[DocumentMode] = None
    document_constraints: Optional[DocumentConstraints] = None
    
    # Role-based configuration
    role_config: Dict[UserRole, Dict[str, Any]] = Field(default_factory=dict)
    
    # Customer-specific visibility
    customer_specific: bool = False
    visible_for_customers: Optional[List[str]] = None
    
    # Dependencies
    dependencies: Optional[List[FieldDependency]] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Template(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: MultiLanguageText
    description: Optional[MultiLanguageText] = None
    fields: List[str] = Field(default_factory=list)  # Field IDs
    
    # Role-based configuration
    role_config: Dict[UserRole, Dict[str, Any]] = Field(default_factory=dict)
    
    # Customer-specific configuration
    customer_specific: bool = False
    visible_for_customers: Optional[List[str]] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

class ChangeLogEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    entity_type: str  # "template" or "field"
    entity_id: str
    action: str  # "created", "updated", "deleted"
    changes: Dict[str, Any]  # What changed
    user_id: str
    user_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Request/Response Models
class TemplateCreate(BaseModel):
    name: MultiLanguageText
    description: Optional[MultiLanguageText] = None

class TemplateUpdate(BaseModel):
    name: Optional[MultiLanguageText] = None
    description: Optional[MultiLanguageText] = None
    fields: Optional[List[str]] = None

class FieldCreate(BaseModel):
    name: MultiLanguageText
    type: FieldType
    visibility: FieldVisibility = FieldVisibility.EDITABLE
    requirement: FieldRequirement = FieldRequirement.OPTIONAL
    validation: Optional[FieldValidation] = None
    select_type: Optional[SelectType] = None
    options: Optional[List[SelectOption]] = None
    document_mode: Optional[DocumentMode] = None
    document_constraints: Optional[DocumentConstraints] = None

class TemplateRenderRequest(BaseModel):
    template_ids: List[str]
    role: UserRole
    customer_id: Optional[str] = None
    language: Language = Language.DE

class TemplateRenderResponse(BaseModel):
    templates: List[Dict[str, Any]]
    fields: List[Dict[str, Any]]

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Vorprozess Regelwerk API v1.0", "status": "running"}

# Template endpoints
@api_router.post("/templates", response_model=Template)
async def create_template(template_data: TemplateCreate, user_id: str = "system"):
    template_dict = template_data.dict()
    template_obj = Template(**template_dict, created_by=user_id, updated_by=user_id)
    
    # Insert into database
    result = await db.templates.insert_one(template_obj.dict())
    
    # Log change
    await log_change("template", template_obj.id, "created", template_dict, user_id, "System User")
    
    return template_obj

@api_router.get("/templates", response_model=List[Template])
async def get_templates():
    templates = await db.templates.find().to_list(1000)
    return [Template(**template) for template in templates]

@api_router.get("/templates/{template_id}", response_model=Template)
async def get_template(template_id: str):
    template = await db.templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return Template(**template)

@api_router.put("/templates/{template_id}", response_model=Template)
async def update_template(template_id: str, template_data: TemplateUpdate, user_id: str = "system"):
    # Get existing template
    existing = await db.templates.find_one({"id": template_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Update fields
    update_data = {k: v for k, v in template_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    update_data["updated_by"] = user_id
    
    # Update in database
    await db.templates.update_one({"id": template_id}, {"$set": update_data})
    
    # Log change
    await log_change("template", template_id, "updated", update_data, user_id, "System User")
    
    # Return updated template
    updated = await db.templates.find_one({"id": template_id})
    return Template(**updated)

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user_id: str = "system"):
    result = await db.templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Log change
    await log_change("template", template_id, "deleted", {}, user_id, "System User")
    
    return {"message": "Template deleted successfully"}

# Field endpoints
@api_router.post("/fields", response_model=Field)
async def create_field(field_data: FieldCreate, user_id: str = "system"):
    field_dict = field_data.dict()
    field_obj = Field(**field_dict)
    
    # Insert into database
    result = await db.fields.insert_one(field_obj.dict())
    
    # Log change
    await log_change("field", field_obj.id, "created", field_dict, user_id, "System User")
    
    return field_obj

@api_router.get("/fields", response_model=List[Field])
async def get_fields():
    fields = await db.fields.find().to_list(1000)
    return [Field(**field) for field in fields]

@api_router.get("/fields/{field_id}", response_model=Field)
async def get_field(field_id: str):
    field = await db.fields.find_one({"id": field_id})
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return Field(**field)

@api_router.put("/fields/{field_id}", response_model=Field)
async def update_field(field_id: str, field_data: FieldCreate, user_id: str = "system"):
    # Get existing field
    existing = await db.fields.find_one({"id": field_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Update fields
    update_data = field_data.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    # Update in database
    await db.fields.update_one({"id": field_id}, {"$set": update_data})
    
    # Log change
    await log_change("field", field_id, "updated", update_data, user_id, "System User")
    
    # Return updated field
    updated = await db.fields.find_one({"id": field_id})
    return Field(**updated)

@api_router.delete("/fields/{field_id}")
async def delete_field(field_id: str, user_id: str = "system"):
    result = await db.fields.delete_one({"id": field_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Log change
    await log_change("field", field_id, "deleted", {}, user_id, "System User")
    
    return {"message": "Field deleted successfully"}

# Template rendering for roles
@api_router.post("/templates/render", response_model=TemplateRenderResponse)
async def render_templates(render_request: TemplateRenderRequest):
    # Get templates
    templates = await db.templates.find({"id": {"$in": render_request.template_ids}}).to_list(1000)
    
    # Collect all field IDs
    all_field_ids = []
    for template in templates:
        all_field_ids.extend(template.get("fields", []))
    
    # Get fields
    fields = await db.fields.find({"id": {"$in": all_field_ids}}).to_list(1000)
    
    # Filter and process based on role, customer, dependencies
    filtered_templates = []
    filtered_fields = []
    
    for template in templates:
        # Apply role and customer filtering logic here
        # For now, return all (will implement filtering logic later)
        filtered_templates.append(template)
    
    for field in fields:
        # Apply role and customer filtering logic here
        # For now, return all (will implement filtering logic later)
        filtered_fields.append(field)
    
    return TemplateRenderResponse(
        templates=filtered_templates,
        fields=filtered_fields
    )

# Change log endpoints
@api_router.get("/changelog", response_model=List[ChangeLogEntry])
async def get_changelog(limit: int = 100, entity_type: Optional[str] = None):
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    
    changelog = await db.change_logs.find(query).sort("timestamp", -1).limit(limit).to_list(limit)
    return [ChangeLogEntry(**entry) for entry in changelog]

@api_router.get("/changelog/{entity_id}")
async def get_entity_changelog(entity_id: str):
    changelog = await db.change_logs.find({"entity_id": entity_id}).sort("timestamp", -1).to_list(100)
    return [ChangeLogEntry(**entry) for entry in changelog]

# Helper function for logging changes
async def log_change(entity_type: str, entity_id: str, action: str, changes: Dict[str, Any], user_id: str, user_name: str):
    log_entry = ChangeLogEntry(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        changes=changes,
        user_id=user_id,
        user_name=user_name
    )
    await db.change_logs.insert_one(log_entry.dict())

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()