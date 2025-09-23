from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Union, Any
import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy.orm import Session
from sqlalchemy import func

# Import database modules
from database import (
    get_db, create_tables, Template, Field, ChangeLogEntry, MultiLanguageText,
    get_multilanguage_text, set_multilanguage_text, update_multilanguage_text
)
from dependency_engine import DependencyEngine
from advanced_validation import AdvancedValidator

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
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

# Pydantic Models for API
class MultiLanguageTextModel(BaseModel):
    de: str = ""
    fr: str = ""
    it: str = ""

class FieldDependency(BaseModel):
    field_id: str
    condition_value: Union[str, List[str]]
    operator: str = "equals"

class DocumentConstraints(BaseModel):
    max_size_mb: Optional[float] = None
    allowed_formats: Optional[List[str]] = None

class SelectOption(BaseModel):
    id: str = str(uuid.uuid4())
    label: MultiLanguageTextModel
    value: str

class FieldValidation(BaseModel):
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    pattern: Optional[str] = None
    date_format: Optional[str] = None

# Request Models
class TemplateCreate(BaseModel):
    name: MultiLanguageTextModel
    description: Optional[MultiLanguageTextModel] = None

class TemplateUpdate(BaseModel):
    name: Optional[MultiLanguageTextModel] = None
    description: Optional[MultiLanguageTextModel] = None
    fields: Optional[List[str]] = None

class FieldCreate(BaseModel):
    name: MultiLanguageTextModel
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

# Response Models
class TemplateResponse(BaseModel):
    id: str
    name: MultiLanguageTextModel
    description: Optional[MultiLanguageTextModel]
    fields: List[str]
    role_config: Dict[str, Any]
    customer_specific: bool
    visible_for_customers: Optional[List[str]]
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str]
    updated_by: Optional[str]

class FieldResponse(BaseModel):
    id: str
    name: MultiLanguageTextModel
    type: FieldType
    visibility: FieldVisibility
    requirement: FieldRequirement
    validation: Optional[Dict[str, Any]]
    select_type: Optional[SelectType]
    options: Optional[List[Dict[str, Any]]]
    document_mode: Optional[DocumentMode]
    document_constraints: Optional[Dict[str, Any]]
    role_config: Dict[str, Any]
    customer_specific: bool
    visible_for_customers: Optional[List[str]]
    dependencies: Optional[List[Dict[str, Any]]]
    created_at: datetime
    updated_at: datetime

class ChangeLogResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    changes: Dict[str, Any]
    user_id: str
    user_name: str
    timestamp: datetime

class TemplateRenderResponse(BaseModel):
    templates: List[Dict[str, Any]]
    fields: List[Dict[str, Any]]

# Helper Functions
def db_template_to_response(db_template: Template, db: Session) -> TemplateResponse:
    """Convert database template to API response model"""
    name = get_multilanguage_text(db, "template_name", db_template.id)
    description = get_multilanguage_text(db, "template_description", db_template.id)
    
    return TemplateResponse(
        id=db_template.id,
        name=MultiLanguageTextModel(**name) if name else MultiLanguageTextModel(),
        description=MultiLanguageTextModel(**description) if description else None,
        fields=[field.id for field in db_template.fields],
        role_config=db_template.role_config or {},
        customer_specific=db_template.customer_specific,
        visible_for_customers=db_template.visible_for_customers,
        created_at=db_template.created_at,
        updated_at=db_template.updated_at,
        created_by=db_template.created_by,
        updated_by=db_template.updated_by
    )

def db_field_to_response(db_field: Field, db: Session) -> FieldResponse:
    """Convert database field to API response model"""
    name = get_multilanguage_text(db, "field_name", db_field.id)
    
    return FieldResponse(
        id=db_field.id,
        name=MultiLanguageTextModel(**name) if name else MultiLanguageTextModel(),
        type=db_field.type,
        visibility=db_field.visibility,
        requirement=db_field.requirement,
        validation=db_field.validation,
        select_type=db_field.select_type,
        options=db_field.options,
        document_mode=db_field.document_mode,
        document_constraints=db_field.document_constraints,
        role_config=db_field.role_config or {},
        customer_specific=db_field.customer_specific,
        visible_for_customers=db_field.visible_for_customers,
        dependencies=db_field.dependencies,
        created_at=db_field.created_at,
        updated_at=db_field.updated_at
    )

async def log_change(db: Session, entity_type: str, entity_id: str, action: str, 
                    changes: Dict[str, Any], user_id: str = "system", user_name: str = "System User"):
    """Log changes to the change log table"""
    log_entry = ChangeLogEntry(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        changes=changes,
        user_id=user_id,
        user_name=user_name
    )
    db.add(log_entry)
    db.commit()

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Vorprozess Regelwerk API v1.0 with SQL Server", "status": "running"}

# Template endpoints
@api_router.post("/templates", response_model=TemplateResponse)
async def create_template(template_data: TemplateCreate, user_id: str = "system", db: Session = Depends(get_db)):
    # Create template
    db_template = Template(
        created_by=user_id,
        updated_by=user_id
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    # Set multilanguage texts
    set_multilanguage_text(db, "template_name", db_template.id, template_data.name.dict())
    if template_data.description:
        set_multilanguage_text(db, "template_description", db_template.id, template_data.description.dict())
    
    # Log change
    await log_change(db, "template", db_template.id, "created", template_data.dict(), user_id, "System User")
    
    return db_template_to_response(db_template, db)

@api_router.get("/templates", response_model=List[TemplateResponse])
async def get_templates(db: Session = Depends(get_db)):
    templates = db.query(Template).all()
    return [db_template_to_response(template, db) for template in templates]

@api_router.get("/templates/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return db_template_to_response(template, db)

@api_router.put("/templates/{template_id}", response_model=TemplateResponse)
async def update_template(template_id: str, template_data: TemplateUpdate, user_id: str = "system", db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Update basic fields
    template.updated_at = datetime.utcnow()
    template.updated_by = user_id
    
    # Handle fields update
    if template_data.fields is not None:
        # Clear existing relationships
        template.fields.clear()
        # Add new field relationships
        fields = db.query(Field).filter(Field.id.in_(template_data.fields)).all()
        template.fields.extend(fields)
    
    # Update multilanguage texts
    if template_data.name:
        update_multilanguage_text(db, "template_name", template_id, template_data.name.dict())
    if template_data.description:
        update_multilanguage_text(db, "template_description", template_id, template_data.description.dict())
    
    db.commit()
    
    # Log change
    await log_change(db, "template", template_id, "updated", template_data.dict(exclude_unset=True), user_id, "System User")
    
    return db_template_to_response(template, db)

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str, user_id: str = "system", db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Delete multilanguage texts
    db.query(MultiLanguageText).filter(
        MultiLanguageText.entity_type.in_(["template_name", "template_description"]),
        MultiLanguageText.entity_id == template_id
    ).delete()
    
    # Delete template
    db.delete(template)
    db.commit()
    
    # Log change
    await log_change(db, "template", template_id, "deleted", {}, user_id, "System User")
    
    return {"message": "Template deleted successfully"}

# Field endpoints
@api_router.post("/fields", response_model=FieldResponse)
async def create_field(field_data: FieldCreate, user_id: str = "system", db: Session = Depends(get_db)):
    # Create field
    db_field = Field(
        type=field_data.type,
        visibility=field_data.visibility,
        requirement=field_data.requirement,
        validation=field_data.validation.dict() if field_data.validation else {},
        select_type=field_data.select_type,
        options=[opt.dict() for opt in field_data.options] if field_data.options else [],
        document_mode=field_data.document_mode,
        document_constraints=field_data.document_constraints.dict() if field_data.document_constraints else {}
    )
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    
    # Set multilanguage text for field name
    set_multilanguage_text(db, "field_name", db_field.id, field_data.name.dict())
    
    # Log change
    await log_change(db, "field", db_field.id, "created", field_data.dict(), user_id, "System User")
    
    return db_field_to_response(db_field, db)

@api_router.get("/fields", response_model=List[FieldResponse])
async def get_fields(db: Session = Depends(get_db)):
    fields = db.query(Field).all()
    return [db_field_to_response(field, db) for field in fields]

@api_router.get("/fields/{field_id}", response_model=FieldResponse)
async def get_field(field_id: str, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return db_field_to_response(field, db)

@api_router.put("/fields/{field_id}", response_model=FieldResponse)
async def update_field(field_id: str, field_data: FieldCreate, user_id: str = "system", db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Update field properties
    field.type = field_data.type
    field.visibility = field_data.visibility
    field.requirement = field_data.requirement
    field.validation = field_data.validation.dict() if field_data.validation else {}
    field.select_type = field_data.select_type
    field.options = [opt.dict() for opt in field_data.options] if field_data.options else []
    field.document_mode = field_data.document_mode
    field.document_constraints = field_data.document_constraints.dict() if field_data.document_constraints else {}
    field.updated_at = datetime.utcnow()
    
    # Update multilanguage text
    update_multilanguage_text(db, "field_name", field_id, field_data.name.dict())
    
    db.commit()
    
    # Log change
    await log_change(db, "field", field_id, "updated", field_data.dict(), user_id, "System User")
    
    return db_field_to_response(field, db)

@api_router.delete("/fields/{field_id}")
async def delete_field(field_id: str, user_id: str = "system", db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Delete multilanguage texts
    db.query(MultiLanguageText).filter(
        MultiLanguageText.entity_type == "field_name",
        MultiLanguageText.entity_id == field_id
    ).delete()
    
    # Delete field
    db.delete(field)
    db.commit()
    
    # Log change
    await log_change(db, "field", field_id, "deleted", {}, user_id, "System User")
    
    return {"message": "Field deleted successfully"}

# Template rendering for roles with advanced dependency logic
@api_router.post("/templates/render", response_model=TemplateRenderResponse)
async def render_templates(render_request: TemplateRenderRequest, db: Session = Depends(get_db)):
    # Initialize dependency engine
    dep_engine = DependencyEngine(db)
    
    # Get templates with their fields
    templates = db.query(Template).filter(Template.id.in_(render_request.template_ids)).all()
    
    # Process each template with advanced filtering
    template_responses = []
    for template in templates:
        rendered_template = dep_engine.render_template_for_role(
            template=template,
            role=render_request.role,
            customer_id=render_request.customer_id,
            field_values={}  # In real usage, this would come from form data
        )
        template_responses.append(rendered_template)
    
    # Collect all fields for separate response (backward compatibility)
    all_fields = []
    for template_response in template_responses:
        all_fields.extend(template_response.get('fields', []))
    
    return TemplateRenderResponse(
        templates=template_responses,
        fields=all_fields
    )

# Advanced validation endpoint
@api_router.post("/validate-field")
async def validate_field_value(
    field_id: str, 
    value: Any, 
    db: Session = Depends(get_db)
):
    """Validate a field value using advanced validation rules"""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    validator = AdvancedValidator()
    result = validator.validate_value(value, field.validation or {})
    
    return {
        "field_id": field_id,
        "value": value,
        "valid": result["valid"],
        "errors": result["errors"]
    }

# Get validation schema for field type
@api_router.get("/validation-schema/{field_type}")
async def get_validation_schema(field_type: str):
    """Get available validation options for a field type"""
    validator = AdvancedValidator()
    schema = validator.get_validation_schema(field_type)
    
    return {
        "field_type": field_type,
        "validation_options": schema
    }

# Simulate template with field values (for dependency testing)
@api_router.post("/templates/simulate")
async def simulate_template_with_values(
    template_id: str,
    role: UserRole,
    field_values: Dict[str, Any],
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Simulate template rendering with specific field values for dependency testing"""
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    dep_engine = DependencyEngine(db)
    rendered_template = dep_engine.render_template_for_role(
        template=template,
        role=role,
        customer_id=customer_id,
        field_values=field_values
    )
    
    return {
        "template": rendered_template,
        "field_values": field_values,
        "visible_field_count": len(rendered_template.get('fields', [])),
        "simulation_info": {
            "role": role,
            "customer_id": customer_id,
            "dependencies_processed": True
        }
    }
@api_router.get("/changelog", response_model=List[ChangeLogResponse])
async def get_changelog(limit: int = 100, entity_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ChangeLogEntry)
    
    if entity_type:
        query = query.filter(ChangeLogEntry.entity_type == entity_type)
    
    changelog = query.order_by(ChangeLogEntry.timestamp.desc()).limit(limit).all()
    
    return [ChangeLogResponse(
        id=entry.id,
        entity_type=entry.entity_type,
        entity_id=entry.entity_id,
        action=entry.action,
        changes=entry.changes,
        user_id=entry.user_id,
        user_name=entry.user_name,
        timestamp=entry.timestamp
    ) for entry in changelog]

@api_router.get("/changelog/{entity_id}")
async def get_entity_changelog(entity_id: str, db: Session = Depends(get_db)):
    changelog = db.query(ChangeLogEntry).filter(
        ChangeLogEntry.entity_id == entity_id
    ).order_by(ChangeLogEntry.timestamp.desc()).limit(100).all()
    
    return [ChangeLogResponse(
        id=entry.id,
        entity_type=entry.entity_type,
        entity_id=entry.entity_id,
        action=entry.action,
        changes=entry.changes,
        user_id=entry.user_id,
        user_name=entry.user_name,
        timestamp=entry.timestamp
    ) for entry in changelog]

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

@app.on_event("startup")
async def startup_event():
    create_tables()
    logger.info("Database tables created successfully")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down")