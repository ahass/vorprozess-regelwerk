"""
Advanced Dependency Engine for Field Conditional Logic
Handles complex field dependencies and conditional rendering
"""

from typing import Dict, List, Any, Optional, Union
from sqlalchemy.orm import Session
from database import Field, Template, get_multilanguage_text
import re
import logging

logger = logging.getLogger(__name__)

class DependencyEngine:
    """Engine to process field dependencies and conditional logic"""
    
    def __init__(self, db: Session):
        self.db = db
        
    def evaluate_condition(self, condition: Dict[str, Any], field_values: Dict[str, Any]) -> bool:
        """
        Evaluate a single dependency condition
        
        Args:
            condition: Dictionary containing field_id, operator, and condition_value
            field_values: Current values of all fields
            
        Returns:
            Boolean result of condition evaluation
        """
        field_id = condition.get('field_id')
        operator = condition.get('operator', 'equals')
        condition_value = condition.get('condition_value')
        
        if field_id not in field_values:
            return False
            
        current_value = field_values[field_id]
        
        try:
            if operator == 'equals':
                return current_value == condition_value
            elif operator == 'not_equals':
                return current_value != condition_value
            elif operator == 'in':
                if isinstance(condition_value, list):
                    return current_value in condition_value
                return False
            elif operator == 'not_in':
                if isinstance(condition_value, list):
                    return current_value not in condition_value
                return True
            elif operator == 'contains':
                return str(condition_value).lower() in str(current_value).lower()
            elif operator == 'greater_than':
                return float(current_value) > float(condition_value)
            elif operator == 'less_than':
                return float(current_value) < float(condition_value)
            elif operator == 'regex_match':
                return bool(re.match(str(condition_value), str(current_value)))
            elif operator == 'is_empty':
                return not current_value or current_value == ''
            elif operator == 'is_not_empty':
                return current_value and current_value != ''
            else:
                logger.warning(f"Unknown operator: {operator}")
                return False
                
        except (ValueError, TypeError) as e:
            logger.error(f"Error evaluating condition: {e}")
            return False
    
    def should_show_field(self, field: Field, field_values: Dict[str, Any]) -> bool:
        """
        Determine if a field should be shown based on its dependencies
        
        Args:
            field: The field to evaluate
            field_values: Current values of all fields
            
        Returns:
            Boolean indicating if field should be visible
        """
        if not field.dependencies:
            return True
            
        # If field has dependencies, all must be satisfied (AND logic)
        for dependency in field.dependencies:
            if not self.evaluate_condition(dependency, field_values):
                return False
                
        return True
    
    def filter_fields_by_dependencies(self, fields: List[Field], field_values: Dict[str, Any]) -> List[Field]:
        """
        Filter fields based on dependency conditions
        
        Args:
            fields: List of fields to filter
            field_values: Current field values
            
        Returns:
            Filtered list of fields that should be visible
        """
        visible_fields = []
        
        for field in fields:
            if self.should_show_field(field, field_values):
                visible_fields.append(field)
                
        return visible_fields
    
    def filter_fields_by_role(self, fields: List[Field], role: str) -> List[Field]:
        """
        Filter fields based on role configuration
        
        Args:
            fields: List of fields to filter
            role: User role (anmelder, klient, admin)
            
        Returns:
            Fields visible for the specified role
        """
        visible_fields = []
        
        for field in fields:
            role_config = field.role_config or {}
            
            # If no role config, show to everyone
            if not role_config:
                visible_fields.append(field)
                continue
                
            # Check role-specific configuration
            if role in role_config:
                config = role_config[role]
                if config.get('visible', True):
                    # Apply role-specific overrides
                    if config.get('visibility'):
                        field.visibility = config['visibility']
                    if config.get('requirement'):
                        field.requirement = config['requirement']
                    visible_fields.append(field)
            else:
                # Default behavior if role not specified
                visible_fields.append(field)
                
        return visible_fields
    
    def filter_fields_by_customer(self, fields: List[Field], customer_id: Optional[str]) -> List[Field]:
        """
        Filter fields based on customer-specific configuration
        
        Args:
            fields: List of fields to filter
            customer_id: Customer identifier
            
        Returns:
            Fields visible for the specified customer
        """
        if not customer_id:
            # Show all non-customer-specific fields
            return [f for f in fields if not f.customer_specific]
            
        visible_fields = []
        
        for field in fields:
            if not field.customer_specific:
                # Non-customer-specific fields are visible to all
                visible_fields.append(field)
            elif field.visible_for_customers and customer_id in field.visible_for_customers:
                # Customer-specific field visible to this customer
                visible_fields.append(field)
                
        return visible_fields
    
    def validate_field_value(self, field: Field, value: Any) -> Dict[str, Any]:
        """
        Validate a field value against its validation rules
        
        Args:
            field: The field to validate
            value: The value to validate
            
        Returns:
            Dictionary with 'valid' boolean and 'errors' list
        """
        result = {'valid': True, 'errors': []}
        
        if not field.validation:
            return result
            
        validation = field.validation
        
        try:
            # Required field validation
            if field.requirement == 'required' and (not value or value == ''):
                result['valid'] = False
                result['errors'].append('Field is required')
                return result
            
            # Skip other validations if field is empty and optional
            if not value or value == '':
                return result
            
            # String length validation
            if field.type == 'text':
                str_value = str(value)
                
                if validation.get('min_length') and len(str_value) < validation['min_length']:
                    result['valid'] = False
                    result['errors'].append(f"Minimum length is {validation['min_length']}")
                    
                if validation.get('max_length') and len(str_value) > validation['max_length']:
                    result['valid'] = False
                    result['errors'].append(f"Maximum length is {validation['max_length']}")
                    
                if validation.get('pattern'):
                    if not re.match(validation['pattern'], str_value):
                        result['valid'] = False
                        result['errors'].append("Value does not match required pattern")
            
            # Document validation
            elif field.type == 'document' and field.document_constraints:
                constraints = field.document_constraints
                
                # File size validation (if applicable)
                if constraints.get('max_size_mb') and hasattr(value, 'size'):
                    max_size_bytes = constraints['max_size_mb'] * 1024 * 1024
                    if value.size > max_size_bytes:
                        result['valid'] = False
                        result['errors'].append(f"File size exceeds {constraints['max_size_mb']}MB")
                
                # File format validation (if applicable)
                if constraints.get('allowed_formats') and hasattr(value, 'filename'):
                    file_ext = value.filename.split('.')[-1].lower()
                    if file_ext not in constraints['allowed_formats']:
                        result['valid'] = False
                        result['errors'].append(f"File format not allowed. Allowed: {', '.join(constraints['allowed_formats'])}")
            
            # Select field validation
            elif field.type == 'select' and field.options:
                valid_values = [opt['value'] for opt in field.options]
                
                if field.select_type == 'multiple':
                    if isinstance(value, list):
                        for v in value:
                            if v not in valid_values:
                                result['valid'] = False
                                result['errors'].append(f"Invalid selection: {v}")
                    else:
                        result['valid'] = False
                        result['errors'].append("Multiple selection must be a list")
                else:
                    if value not in valid_values:
                        result['valid'] = False
                        result['errors'].append(f"Invalid selection: {value}")
                        
        except Exception as e:
            logger.error(f"Error validating field {field.id}: {e}")
            result['valid'] = False
            result['errors'].append("Validation error occurred")
            
        return result
    
    def render_template_for_role(self, template: Template, role: str, 
                                customer_id: Optional[str] = None, 
                                field_values: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Render a template with all filtering and dependency logic applied
        
        Args:
            template: The template to render
            role: User role
            customer_id: Optional customer ID
            field_values: Current field values for dependency evaluation
            
        Returns:
            Rendered template with filtered fields
        """
        if field_values is None:
            field_values = {}
            
        # Start with all template fields
        fields = list(template.fields)
        
        # Apply role-based filtering
        fields = self.filter_fields_by_role(fields, role)
        
        # Apply customer-based filtering
        fields = self.filter_fields_by_customer(fields, customer_id)
        
        # Apply dependency-based filtering
        fields = self.filter_fields_by_dependencies(fields, field_values)
        
        # Convert to response format with multilanguage texts
        field_responses = []
        for field in fields:
            field_dict = {
                "id": field.id,
                "name": get_multilanguage_text(self.db, "field_name", field.id),
                "type": field.type,
                "visibility": field.visibility,
                "requirement": field.requirement,
                "validation": field.validation,
                "select_type": field.select_type,
                "options": field.options,
                "document_mode": field.document_mode,
                "document_constraints": field.document_constraints,
                "dependencies": field.dependencies
            }
            field_responses.append(field_dict)
        
        template_dict = {
            "id": template.id,
            "name": get_multilanguage_text(self.db, "template_name", template.id),
            "description": get_multilanguage_text(self.db, "template_description", template.id),
            "fields": field_responses
        }
        
        return template_dict