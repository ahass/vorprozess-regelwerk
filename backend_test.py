#!/usr/bin/env python3
"""
Backend API Compatibility Tests for Vorprozess Regelwerk
Tests the FastAPI backend endpoints for compatibility with React frontend
"""

import requests
import json
import os
import sys
from typing import Dict, Any, List
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://form-wizard-api.preview.emergentagent.com')
# For testing, use localhost since C# backend is running locally
API_BASE_URL = "http://localhost:8001/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.created_template_id = None
        self.created_field_id = None
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        if response_data:
            result['response_data'] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()

    def test_get_templates(self):
        """Test GET /api/templates"""
        try:
            response = self.session.get(f"{API_BASE_URL}/templates")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check structure of first template if any exist
                    if data:
                        template = data[0]
                        required_fields = ['id', 'name', 'description', 'fields', 'roleConfig', 
                                         'customerSpecific', 'visibleForCustomers', 'createdAt', 'updatedAt']
                        missing_fields = [field for field in required_fields if field not in template]
                        
                        if missing_fields:
                            self.log_result("GET /api/templates", False, 
                                          f"Missing required fields: {missing_fields}", template)
                        else:
                            # Check multilingual name structure
                            if isinstance(template.get('name'), dict):
                                name_langs = template['name']
                                if 'de' in name_langs or 'fr' in name_langs or 'it' in name_langs:
                                    self.log_result("GET /api/templates", True, 
                                                  f"Retrieved {len(data)} templates with correct structure")
                                else:
                                    self.log_result("GET /api/templates", False, 
                                                  "Name field missing multilingual structure (de/fr/it)", template)
                            else:
                                self.log_result("GET /api/templates", False, 
                                              "Name field is not a multilingual object", template)
                    else:
                        self.log_result("GET /api/templates", True, "Retrieved empty templates array")
                else:
                    self.log_result("GET /api/templates", False, "Response is not an array", data)
            else:
                self.log_result("GET /api/templates", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("GET /api/templates", False, f"Exception: {str(e)}")

    def test_get_fields(self):
        """Test GET /api/fields"""
        try:
            response = self.session.get(f"{API_BASE_URL}/fields")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check structure of first field if any exist
                    if data:
                        field = data[0]
                        required_fields = ['id', 'name', 'type', 'visibility', 'requirement', 
                                         'validation', 'roleConfig', 'customerSpecific', 
                                         'visibleForCustomers', 'dependencies', 'createdAt', 'updatedAt']
                        missing_fields = [field_name for field_name in required_fields if field_name not in field]
                        
                        if missing_fields:
                            self.log_result("GET /api/fields", False, 
                                          f"Missing required fields: {missing_fields}", field)
                        else:
                            # Check field type specific fields
                            field_type = field.get('type')
                            if field_type == 'select' and 'select_type' not in field:
                                self.log_result("GET /api/fields", False, 
                                              "Select field missing select_type", field)
                            elif field_type == 'document' and 'document_mode' not in field:
                                self.log_result("GET /api/fields", False, 
                                              "Document field missing document_mode", field)
                            else:
                                self.log_result("GET /api/fields", True, 
                                              f"Retrieved {len(data)} fields with correct structure")
                    else:
                        self.log_result("GET /api/fields", True, "Retrieved empty fields array")
                else:
                    self.log_result("GET /api/fields", False, "Response is not an array", data)
            else:
                self.log_result("GET /api/fields", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("GET /api/fields", False, f"Exception: {str(e)}")

    def test_create_template(self):
        """Test POST /api/templates"""
        try:
            template_data = {
                "name": {
                    "de": "Test Template Deutsch",
                    "fr": "Test Template Français", 
                    "it": "Test Template Italiano"
                },
                "description": {
                    "de": "Test Beschreibung",
                    "fr": "Test Description",
                    "it": "Test Descrizione"
                }
            }
            
            response = self.session.post(f"{API_BASE_URL}/templates", json=template_data)
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if 'id' in data:
                    self.created_template_id = data['id']
                    # Check if Location header or ID is returned
                    location = response.headers.get('Location')
                    self.log_result("POST /api/templates", True, 
                                  f"Created template with ID: {data['id']}")
                else:
                    self.log_result("POST /api/templates", False, 
                                  "Response missing ID field", data)
            else:
                self.log_result("POST /api/templates", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("POST /api/templates", False, f"Exception: {str(e)}")

    def test_get_template_by_id(self):
        """Test GET /api/templates/{id}"""
        if not self.created_template_id:
            self.log_result("GET /api/templates/{id}", False, "No template ID available for testing")
            return
            
        try:
            response = self.session.get(f"{API_BASE_URL}/templates/{self.created_template_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('id') == self.created_template_id:
                    self.log_result("GET /api/templates/{id}", True, 
                                  f"Retrieved template by ID: {self.created_template_id}")
                else:
                    self.log_result("GET /api/templates/{id}", False, 
                                  "Retrieved template ID doesn't match", data)
            else:
                self.log_result("GET /api/templates/{id}", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("GET /api/templates/{id}", False, f"Exception: {str(e)}")

    def test_update_template(self):
        """Test PUT /api/templates/{id}"""
        if not self.created_template_id:
            self.log_result("PUT /api/templates/{id}", False, "No template ID available for testing")
            return
            
        try:
            update_data = {
                "name": {
                    "de": "Updated Test Template Deutsch",
                    "fr": "Updated Test Template Français",
                    "it": "Updated Test Template Italiano"
                }
            }
            
            response = self.session.put(f"{API_BASE_URL}/templates/{self.created_template_id}", 
                                      json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('name', {}).get('de') == "Updated Test Template Deutsch":
                    self.log_result("PUT /api/templates/{id}", True, 
                                  f"Updated template: {self.created_template_id}")
                else:
                    self.log_result("PUT /api/templates/{id}", False, 
                                  "Template not updated correctly", data)
            else:
                self.log_result("PUT /api/templates/{id}", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("PUT /api/templates/{id}", False, f"Exception: {str(e)}")

    def test_create_field(self):
        """Test POST /api/fields"""
        try:
            field_data = {
                "name": {
                    "de": "Test Feld",
                    "fr": "Champ Test",
                    "it": "Campo Test"
                },
                "type": "text",
                "visibility": "editable",
                "requirement": "optional",
                "validation": {
                    "min_length": 1,
                    "max_length": 100
                }
            }
            
            response = self.session.post(f"{API_BASE_URL}/fields", json=field_data)
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if 'id' in data:
                    self.created_field_id = data['id']
                    self.log_result("POST /api/fields", True, 
                                  f"Created field with ID: {data['id']}")
                else:
                    self.log_result("POST /api/fields", False, 
                                  "Response missing ID field", data)
            else:
                self.log_result("POST /api/fields", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("POST /api/fields", False, f"Exception: {str(e)}")

    def test_update_field(self):
        """Test PUT /api/fields/{id}"""
        if not self.created_field_id:
            self.log_result("PUT /api/fields/{id}", False, "No field ID available for testing")
            return
            
        try:
            update_data = {
                "name": {
                    "de": "Updated Test Feld",
                    "fr": "Updated Champ Test",
                    "it": "Updated Campo Test"
                },
                "requirement": "required"
            }
            
            response = self.session.put(f"{API_BASE_URL}/fields/{self.created_field_id}", 
                                      json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('requirement') == "required":
                    self.log_result("PUT /api/fields/{id}", True, 
                                  f"Updated field: {self.created_field_id}")
                else:
                    self.log_result("PUT /api/fields/{id}", False, 
                                  "Field not updated correctly", data)
            else:
                self.log_result("PUT /api/fields/{id}", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("PUT /api/fields/{id}", False, f"Exception: {str(e)}")

    def test_template_render(self):
        """Test POST /api/templates/render"""
        try:
            render_data = {
                "template_ids": [self.created_template_id] if self.created_template_id else [],
                "role": "anmelder",
                "customer_id": "c1",
                "language": "de"
            }
            
            response = self.session.post(f"{API_BASE_URL}/templates/render", json=render_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'templates' in data and 'fields' in data:
                    if isinstance(data['templates'], list) and isinstance(data['fields'], list):
                        self.log_result("POST /api/templates/render", True, 
                                      f"Rendered {len(data['templates'])} templates with {len(data['fields'])} fields")
                    else:
                        self.log_result("POST /api/templates/render", False, 
                                      "Response structure incorrect", data)
                else:
                    self.log_result("POST /api/templates/render", False, 
                                  "Missing templates or fields in response", data)
            else:
                self.log_result("POST /api/templates/render", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("POST /api/templates/render", False, f"Exception: {str(e)}")

    def test_template_simulate(self):
        """Test POST /api/templates/simulate"""
        if not self.created_template_id:
            self.log_result("POST /api/templates/simulate", False, "No template ID available for testing")
            return
            
        try:
            # Test with existing template
            params = {
                "templateId": self.created_template_id,
                "role": "anmelder"
            }
            simulate_data = {}
            
            response = self.session.post(f"{API_BASE_URL}/templates/simulate", 
                                       params=params, json=simulate_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'template' in data and 'visible_field_count' in data:
                    self.log_result("POST /api/templates/simulate", True, 
                                  f"Simulated template with {data.get('visible_field_count', 0)} visible fields")
                else:
                    self.log_result("POST /api/templates/simulate", False, 
                                  "Response missing expected fields", data)
            else:
                self.log_result("POST /api/templates/simulate", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("POST /api/templates/simulate", False, f"Exception: {str(e)}")

        # Test with non-existent template (should return 404)
        try:
            params = {
                "templateId": "non-existent-id",
                "role": "anmelder"
            }
            simulate_data = {}
            
            response = self.session.post(f"{API_BASE_URL}/templates/simulate", 
                                       params=params, json=simulate_data)
            
            if response.status_code == 404:
                self.log_result("POST /api/templates/simulate (404 test)", True, 
                              "Correctly returned 404 for non-existent template")
            else:
                self.log_result("POST /api/templates/simulate (404 test)", False, 
                              f"Expected 404, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("POST /api/templates/simulate (404 test)", False, f"Exception: {str(e)}")

    def test_validate_field(self):
        """Test POST /api/fields/validate-field"""
        if not self.created_field_id:
            self.log_result("POST /api/fields/validate-field", False, "No field ID available for testing")
            return
            
        try:
            params = {
                "fieldId": self.created_field_id
            }
            body = {
                "value": "test value"
            }
            
            response = self.session.post(f"{API_BASE_URL}/fields/validate-field", params=params, json=body)
            
            if response.status_code == 200:
                data = response.json()
                if 'valid' in data and 'field_id' in data:
                    self.log_result("POST /api/fields/validate-field", True, 
                                  f"Validated field value, result: {data.get('valid')}")
                else:
                    self.log_result("POST /api/fields/validate-field", False, 
                                  "Response missing expected validation fields", data)
            else:
                self.log_result("POST /api/fields/validate-field", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("POST /api/fields/validate-field", False, f"Exception: {str(e)}")

        # Test with non-existent field (should return 404)
        try:
            params = {
                "fieldId": "non-existent-field-id"
            }
            body = {
                "value": "test value"
            }
            
            response = self.session.post(f"{API_BASE_URL}/fields/validate-field", params=params, json=body)
            
            if response.status_code == 404:
                data = response.json()
                if 'message' in data:
                    self.log_result("POST /api/fields/validate-field (404 test)", True, 
                                  "Correctly returned 404 with message for non-existent field")
                else:
                    self.log_result("POST /api/fields/validate-field (404 test)", False, 
                                  "404 response missing message field", data)
            else:
                self.log_result("POST /api/fields/validate-field (404 test)", False, 
                              f"Expected 404, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("POST /api/fields/validate-field (404 test)", False, f"Exception: {str(e)}")

    def test_validation_schema(self):
        """Test GET /api/fields/validation-schema/{fieldType}"""
        try:
            # Test with known field type
            response = self.session.get(f"{API_BASE_URL}/fields/validation-schema/text")
            
            if response.status_code == 200:
                data = response.json()
                if 'field_type' in data and 'validation_options' in data:
                    self.log_result("GET /api/fields/validation-schema/{fieldType}", True, 
                                  f"Retrieved validation schema for text field")
                else:
                    self.log_result("GET /api/fields/validation-schema/{fieldType}", False, 
                                  "Response missing expected schema fields", data)
            else:
                self.log_result("GET /api/fields/validation-schema/{fieldType}", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("GET /api/fields/validation-schema/{fieldType}", False, f"Exception: {str(e)}")

        # Test with unknown field type (C# backend returns 200 with empty options, which is acceptable)
        try:
            response = self.session.get(f"{API_BASE_URL}/fields/validation-schema/unknown-type")
            
            if response.status_code == 200:
                data = response.json()
                if 'field_type' in data and data['field_type'] == 'unknown-type':
                    self.log_result("GET /api/fields/validation-schema/{fieldType} (unknown type)", True, 
                                  "Correctly handled unknown field type with 200 response")
                else:
                    self.log_result("GET /api/fields/validation-schema/{fieldType} (unknown type)", False, 
                                  "Response structure incorrect for unknown type", data)
            else:
                self.log_result("GET /api/fields/validation-schema/{fieldType} (unknown type)", False, 
                              f"Unexpected status code {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("GET /api/fields/validation-schema/{fieldType} (unknown type)", False, f"Exception: {str(e)}")

    def test_changelog(self):
        """Test GET /api/changelog"""
        try:
            response = self.session.get(f"{API_BASE_URL}/changelog")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("GET /api/changelog", True, 
                                  f"Retrieved {len(data)} changelog entries")
                else:
                    self.log_result("GET /api/changelog", False, 
                                  "Response is not an array", data)
            else:
                self.log_result("GET /api/changelog", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("GET /api/changelog", False, f"Exception: {str(e)}")

    def test_changelog_by_entity(self):
        """Test GET /api/changelog/{entityId}"""
        entity_id = self.created_template_id or "test-entity-id"
        
        try:
            response = self.session.get(f"{API_BASE_URL}/changelog/{entity_id}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("GET /api/changelog/{entityId}", True, 
                                  f"Retrieved {len(data)} changelog entries for entity {entity_id}")
                else:
                    self.log_result("GET /api/changelog/{entityId}", False, 
                                  "Response is not an array", data)
            else:
                self.log_result("GET /api/changelog/{entityId}", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("GET /api/changelog/{entityId}", False, f"Exception: {str(e)}")

    def test_delete_template(self):
        """Test DELETE /api/templates/{id}"""
        if not self.created_template_id:
            self.log_result("DELETE /api/templates/{id}", False, "No template ID available for testing")
            return
            
        try:
            response = self.session.delete(f"{API_BASE_URL}/templates/{self.created_template_id}")
            
            if response.status_code == 200:
                # Verify template is deleted by trying to get it
                get_response = self.session.get(f"{API_BASE_URL}/templates/{self.created_template_id}")
                if get_response.status_code == 404:
                    self.log_result("DELETE /api/templates/{id}", True, 
                                  f"Successfully deleted template {self.created_template_id}")
                else:
                    self.log_result("DELETE /api/templates/{id}", False, 
                                  "Template still exists after deletion")
            else:
                self.log_result("DELETE /api/templates/{id}", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("DELETE /api/templates/{id}", False, f"Exception: {str(e)}")

    def test_delete_field(self):
        """Test DELETE /api/fields/{id}"""
        if not self.created_field_id:
            self.log_result("DELETE /api/fields/{id}", False, "No field ID available for testing")
            return
            
        try:
            response = self.session.delete(f"{API_BASE_URL}/fields/{self.created_field_id}")
            
            if response.status_code == 200:
                # Verify field is deleted by trying to get it
                get_response = self.session.get(f"{API_BASE_URL}/fields/{self.created_field_id}")
                if get_response.status_code == 404:
                    self.log_result("DELETE /api/fields/{id}", True, 
                                  f"Successfully deleted field {self.created_field_id}")
                else:
                    self.log_result("DELETE /api/fields/{id}", False, 
                                  "Field still exists after deletion")
            else:
                self.log_result("DELETE /api/fields/{id}", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("DELETE /api/fields/{id}", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print(f"🚀 Starting Backend API Compatibility Tests")
        print(f"Backend URL: {API_BASE_URL}")
        print("=" * 60)
        
        # Test basic endpoints first
        self.test_get_templates()
        self.test_get_fields()
        self.test_changelog()
        
        # Test CRUD operations
        self.test_create_template()
        self.test_get_template_by_id()
        self.test_update_template()
        
        self.test_create_field()
        self.test_update_field()
        
        # Test advanced endpoints
        self.test_template_render()
        self.test_template_simulate()
        self.test_validate_field()
        self.test_validation_schema()
        self.test_changelog_by_entity()
        
        # Test delete operations last
        self.test_delete_template()
        self.test_delete_field()
        
        # Print summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        return passed, failed

if __name__ == "__main__":
    tester = BackendTester()
    passed, failed = tester.run_all_tests()
    
    # Exit with error code if tests failed
    sys.exit(0 if failed == 0 else 1)