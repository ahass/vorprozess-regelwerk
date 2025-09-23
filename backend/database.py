from sqlalchemy import create_engine, Column, String, DateTime, Text, Boolean, Integer, Float, ForeignKey, Table, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.types import TypeDecorator, TEXT
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# SQL Server / SQLite Connection (configurable)
database_url = os.environ.get('DATABASE_URL') or os.environ.get('SQL_SERVER_CONNECTION_STRING')
engine = create_engine(database_url, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Custom JSON type for SQLite compatibility
class JSONType(TypeDecorator):
    impl = TEXT

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value

# Use JSONType for both SQLite and SQL Server compatibility
# Association table for template-field many-to-many relationship
template_fields = Table(
    'template_fields',
    Base.metadata,
    Column('template_id', String(36), ForeignKey('templates.id'), primary_key=True),
    Column('field_id', String(36), ForeignKey('fields.id'), primary_key=True)
)

class MultiLanguageText(Base):
    __tablename__ = 'multilanguage_texts'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String(50), nullable=False)  # 'template_name', 'template_description', 'field_name'
    entity_id = Column(String(36), nullable=False)
    language_code = Column(String(2), nullable=False)  # 'de', 'fr', 'it'
    text_value = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Template(Base):
    __tablename__ = 'templates'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Role-based configuration stored as JSON
    role_config = Column(JSONType, default=dict)
    
    # Customer-specific configuration
    customer_specific = Column(Boolean, default=False)
    visible_for_customers = Column(JSONType, default=list)  # List of customer IDs
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    updated_by = Column(String(100))
    
    # Relationships
    fields = relationship("Field", secondary=template_fields, back_populates="templates")

class Field(Base):
    __tablename__ = 'fields'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Field type and properties
    type = Column(String(20), nullable=False)  # 'text', 'select', 'document'
    visibility = Column(String(20), default='editable')  # 'visible', 'editable'
    requirement = Column(String(20), default='optional')  # 'optional', 'required'
    
    # Validation rules stored as JSON
    validation = Column(JSON, default=dict)
    
    # Select field properties
    select_type = Column(String(20))  # 'radio', 'multiple'
    options = Column(JSON, default=list)  # List of select options with multilang labels
    
    # Document field properties
    document_mode = Column(String(50))  # 'download', 'download_upload', etc.
    document_constraints = Column(JSON, default=dict)
    
    # Role-based configuration
    role_config = Column(JSON, default=dict)
    
    # Customer-specific visibility
    customer_specific = Column(Boolean, default=False)
    visible_for_customers = Column(JSON, default=list)
    
    # Dependencies stored as JSON
    dependencies = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    templates = relationship("Template", secondary=template_fields, back_populates="fields")

class ChangeLogEntry(Base):
    __tablename__ = 'change_logs'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String(20), nullable=False)  # 'template' or 'field'
    entity_id = Column(String(36), nullable=False)
    action = Column(String(20), nullable=False)  # 'created', 'updated', 'deleted'
    changes = Column(JSON, default=dict)  # What changed
    user_id = Column(String(100), nullable=False)
    user_name = Column(String(200), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Database dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Helper functions for multilanguage text management
def get_multilanguage_text(db: Session, entity_type: str, entity_id: str) -> dict:
    """Get all language variants for an entity"""
    texts = db.query(MultiLanguageText).filter(
        MultiLanguageText.entity_type == entity_type,
        MultiLanguageText.entity_id == entity_id
    ).all()
    
    result = {}
    for text in texts:
        result[text.language_code] = text.text_value
    
    return result

def set_multilanguage_text(db: Session, entity_type: str, entity_id: str, texts: dict):
    """Set multilanguage texts for an entity"""
    # Delete existing texts
    db.query(MultiLanguageText).filter(
        MultiLanguageText.entity_type == entity_type,
        MultiLanguageText.entity_id == entity_id
    ).delete()
    
    # Insert new texts
    for lang_code, text_value in texts.items():
        if text_value:  # Only store non-empty texts
            ml_text = MultiLanguageText(
                entity_type=entity_type,
                entity_id=entity_id,
                language_code=lang_code,
                text_value=text_value
            )
            db.add(ml_text)
    
    db.commit()

def update_multilanguage_text(db: Session, entity_type: str, entity_id: str, texts: dict):
    """Update multilanguage texts for an entity"""
    for lang_code, text_value in texts.items():
        existing = db.query(MultiLanguageText).filter(
            MultiLanguageText.entity_type == entity_type,
            MultiLanguageText.entity_id == entity_id,
            MultiLanguageText.language_code == lang_code
        ).first()
        
        if existing:
            existing.text_value = text_value
        else:
            ml_text = MultiLanguageText(
                entity_type=entity_type,
                entity_id=entity_id,
                language_code=lang_code,
                text_value=text_value
            )
            db.add(ml_text)
    
    db.commit()