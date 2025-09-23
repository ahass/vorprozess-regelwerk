"""
Advanced Validation Rules and Custom Validators
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, date
from decimal import Decimal
import re
import logging

logger = logging.getLogger(__name__)

class ValidationRule:
    """Base class for validation rules"""
    
    def __init__(self, rule_type: str, config: Dict[str, Any]):
        self.rule_type = rule_type
        self.config = config
    
    def validate(self, value: Any) -> Dict[str, Any]:
        """Validate a value against this rule"""
        raise NotImplementedError

class StringValidationRule(ValidationRule):
    """Validation rules for string/text fields"""
    
    def validate(self, value: Any) -> Dict[str, Any]:
        result = {'valid': True, 'errors': []}
        
        if value is None or value == '':
            return result
            
        str_value = str(value)
        
        # Length validation
        if 'min_length' in self.config:
            if len(str_value) < self.config['min_length']:
                result['valid'] = False
                result['errors'].append(f"Minimum length is {self.config['min_length']} characters")
        
        if 'max_length' in self.config:
            if len(str_value) > self.config['max_length']:
                result['valid'] = False
                result['errors'].append(f"Maximum length is {self.config['max_length']} characters")
        
        # Pattern validation (regex)
        if 'pattern' in self.config:
            try:
                if not re.match(self.config['pattern'], str_value):
                    error_msg = self.config.get('pattern_error', 'Value does not match required pattern')
                    result['valid'] = False
                    result['errors'].append(error_msg)
            except re.error:
                result['valid'] = False
                result['errors'].append('Invalid pattern configuration')
        
        # Email validation
        if self.config.get('format') == 'email':
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, str_value):
                result['valid'] = False
                result['errors'].append('Invalid email format')
        
        # Phone validation
        if self.config.get('format') == 'phone':
            # Basic phone pattern (can be customized)
            phone_pattern = r'^\+?[\d\s\-\(\)]{10,}$'
            if not re.match(phone_pattern, str_value):
                result['valid'] = False
                result['errors'].append('Invalid phone number format')
        
        # URL validation
        if self.config.get('format') == 'url':
            url_pattern = r'^https?://.+'
            if not re.match(url_pattern, str_value):
                result['valid'] = False
                result['errors'].append('Invalid URL format')
        
        return result

class NumberValidationRule(ValidationRule):
    """Validation rules for numeric fields"""
    
    def validate(self, value: Any) -> Dict[str, Any]:
        result = {'valid': True, 'errors': []}
        
        if value is None or value == '':
            return result
        
        try:
            # Convert to number
            if isinstance(value, str):
                if '.' in value:
                    num_value = float(value)
                else:
                    num_value = int(value)
            else:
                num_value = value
            
            # Range validation
            if 'min_value' in self.config:
                if num_value < self.config['min_value']:
                    result['valid'] = False
                    result['errors'].append(f"Minimum value is {self.config['min_value']}")
            
            if 'max_value' in self.config:
                if num_value > self.config['max_value']:
                    result['valid'] = False
                    result['errors'].append(f"Maximum value is {self.config['max_value']}")
            
            # Integer validation
            if self.config.get('integer_only', False):
                if not isinstance(num_value, int) and not num_value.is_integer():
                    result['valid'] = False
                    result['errors'].append('Value must be an integer')
            
            # Decimal places validation
            if 'max_decimal_places' in self.config:
                decimal_value = Decimal(str(num_value))
                decimal_places = abs(decimal_value.as_tuple().exponent)
                if decimal_places > self.config['max_decimal_places']:
                    result['valid'] = False
                    result['errors'].append(f"Maximum {self.config['max_decimal_places']} decimal places allowed")
        
        except (ValueError, TypeError):
            result['valid'] = False
            result['errors'].append('Invalid number format')
        
        return result

class DateValidationRule(ValidationRule):
    """Validation rules for date fields"""
    
    def validate(self, value: Any) -> Dict[str, Any]:
        result = {'valid': True, 'errors': []}
        
        if value is None or value == '':
            return result
        
        try:
            # Parse date
            if isinstance(value, str):
                date_format = self.config.get('format', '%Y-%m-%d')
                date_value = datetime.strptime(value, date_format).date()
            elif isinstance(value, datetime):
                date_value = value.date()
            elif isinstance(value, date):
                date_value = value
            else:
                raise ValueError("Invalid date format")
            
            # Date range validation
            if 'min_date' in self.config:
                min_date = datetime.strptime(self.config['min_date'], '%Y-%m-%d').date()
                if date_value < min_date:
                    result['valid'] = False
                    result['errors'].append(f"Date must be after {self.config['min_date']}")
            
            if 'max_date' in self.config:
                max_date = datetime.strptime(self.config['max_date'], '%Y-%m-%d').date()
                if date_value > max_date:
                    result['valid'] = False
                    result['errors'].append(f"Date must be before {self.config['max_date']}")
            
            # Future date validation
            if self.config.get('no_future_dates', False):
                if date_value > date.today():
                    result['valid'] = False
                    result['errors'].append('Future dates are not allowed')
            
            # Past date validation
            if self.config.get('no_past_dates', False):
                if date_value < date.today():
                    result['valid'] = False
                    result['errors'].append('Past dates are not allowed')
        
        except (ValueError, TypeError):
            result['valid'] = False
            result['errors'].append('Invalid date format')
        
        return result

class FileValidationRule(ValidationRule):
    """Validation rules for file uploads"""
    
    def validate(self, value: Any) -> Dict[str, Any]:
        result = {'valid': True, 'errors': []}
        
        if value is None:
            return result
        
        # File size validation
        if 'max_size_mb' in self.config and hasattr(value, 'size'):
            max_size_bytes = self.config['max_size_mb'] * 1024 * 1024
            if value.size > max_size_bytes:
                result['valid'] = False
                result['errors'].append(f"File size exceeds {self.config['max_size_mb']}MB")
        
        # File type validation
        if 'allowed_extensions' in self.config and hasattr(value, 'filename'):
            filename = value.filename.lower()
            allowed_extensions = [ext.lower() for ext in self.config['allowed_extensions']]
            
            file_extension = None
            if '.' in filename:
                file_extension = filename.split('.')[-1]
            
            if file_extension not in allowed_extensions:
                result['valid'] = False
                result['errors'].append(f"File type not allowed. Allowed: {', '.join(allowed_extensions)}")
        
        # MIME type validation (if available)
        if 'allowed_mime_types' in self.config and hasattr(value, 'content_type'):
            if value.content_type not in self.config['allowed_mime_types']:
                result['valid'] = False
                result['errors'].append('File type not allowed')
        
        return result

class CustomValidationRule(ValidationRule):
    """Custom validation using JavaScript-like expressions"""
    
    def validate(self, value: Any) -> Dict[str, Any]:
        result = {'valid': True, 'errors': []}
        
        # This would implement custom validation logic
        # For now, return valid
        # In production, this could evaluate custom expressions safely
        
        return result

class AdvancedValidator:
    """Main validator class that orchestrates all validation rules"""
    
    def __init__(self):
        self.rule_types = {
            'string': StringValidationRule,
            'number': NumberValidationRule,
            'date': DateValidationRule,
            'file': FileValidationRule,
            'custom': CustomValidationRule
        }
    
    def create_rule(self, rule_type: str, config: Dict[str, Any]) -> ValidationRule:
        """Create a validation rule instance"""
        if rule_type in self.rule_types:
            return self.rule_types[rule_type](rule_type, config)
        else:
            logger.warning(f"Unknown validation rule type: {rule_type}")
            return None
    
    def validate_value(self, value: Any, validation_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate a value against multiple validation rules
        
        Args:
            value: The value to validate
            validation_config: Dictionary containing validation rules
            
        Returns:
            Validation result with overall validity and all errors
        """
        result = {'valid': True, 'errors': []}
        
        if not validation_config:
            return result
        
        # Process each validation rule
        for rule_name, rule_config in validation_config.items():
            if rule_name in self.rule_types:
                rule = self.create_rule(rule_name, rule_config)
                if rule:
                    rule_result = rule.validate(value)
                    if not rule_result['valid']:
                        result['valid'] = False
                        result['errors'].extend(rule_result['errors'])
        
        return result
    
    def get_validation_schema(self, field_type: str) -> Dict[str, Any]:
        """
        Get available validation options for a field type
        
        Args:
            field_type: The type of field (text, select, document)
            
        Returns:
            Schema describing available validation options
        """
        schemas = {
            'text': {
                'string': {
                    'min_length': 'Minimum character length',
                    'max_length': 'Maximum character length',
                    'pattern': 'Regular expression pattern',
                    'pattern_error': 'Custom error message for pattern mismatch',
                    'format': 'Predefined format (email, phone, url)'
                },
                'number': {
                    'min_value': 'Minimum numeric value',
                    'max_value': 'Maximum numeric value',
                    'integer_only': 'Allow only integers',
                    'max_decimal_places': 'Maximum decimal places'
                },
                'date': {
                    'format': 'Date format string',
                    'min_date': 'Minimum allowed date (YYYY-MM-DD)',
                    'max_date': 'Maximum allowed date (YYYY-MM-DD)',
                    'no_future_dates': 'Disallow future dates',
                    'no_past_dates': 'Disallow past dates'
                }
            },
            'document': {
                'file': {
                    'max_size_mb': 'Maximum file size in MB',
                    'allowed_extensions': 'List of allowed file extensions',
                    'allowed_mime_types': 'List of allowed MIME types'
                }
            },
            'select': {
                # Select fields typically don't need complex validation
                # as options are predefined
            }
        }
        
        return schemas.get(field_type, {})