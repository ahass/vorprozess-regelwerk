#!/usr/bin/env python3
"""
Focused Backend Test for PUT /api/templates/{id} SQLite FK Issue
Tests the specific scenario mentioned in the review request
"""

import requests
import json
import os
import sys
from typing import Dict, Any, List
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://form-wizard-api.preview.emergentagent.com')
API_BASE_URL = f"{BACKEND_URL}/api"

class FocusedTemplateTester:
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

    def step_1_create_template(self):
        """Step 1: POST /api/templates -> capture id"""
        try:
            template_data = {
                "name": {
                    "de": "FK Test Template",
                    "fr": "Template Test FK", 
                    "it": "Template Test FK"
                },
                "description": {
                    "de": "Template für FK Test",
                    "fr": "Template pour test FK",
                    "it": "Template per test FK"
                }
            }
            
            response = self.session.post(f"{API_BASE_URL}/templates", json=template_data)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if 'id' in data:
                    self.created_template_id = data['id']
                    self.log_result("Step 1: POST /api/templates", True, 
                                  f"Created template with ID: {data['id']}")
                    return True
                else:
                    self.log_result("Step 1: POST /api/templates", False, 
                                  "Response missing ID field", data)
                    return False
            else:
                self.log_result("Step 1: POST /api/templates", False, 
                              f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Step 1: POST /api/templates", False, f"Exception: {str(e)}")
            return False

    def step_2_create_field(self):
        """Step 2: POST /api/fields -> capture id"""
        try:
            field_data = {
                "name": {
                    "de": "FK Test Feld",
                    "fr": "Champ Test FK",
                    "it": "Campo Test FK"
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
            
            if response.status_code in [200, 201]:
                data = response.json()
                if 'id' in data:
                    self.created_field_id = data['id']
                    self.log_result("Step 2: POST /api/fields", True, 
                                  f"Created field with ID: {data['id']}")
                    return True
                else:
                    self.log_result("Step 2: POST /api/fields", False, 
                                  "Response missing ID field", data)
                    return False
            else:
                self.log_result("Step 2: POST /api/fields", False, 
                              f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Step 2: POST /api/fields", False, f"Exception: {str(e)}")
            return False

    def step_3_update_template_with_field(self):
        """Step 3: PUT /api/templates/{id} with fields: [fieldId] -> expect 200 and fields array contains fieldId"""
        if not self.created_template_id or not self.created_field_id:
            self.log_result("Step 3: PUT /api/templates/{id} with valid field", False, 
                          "Missing template or field ID")
            return False
            
        try:
            update_data = {
                "fields": [self.created_field_id]
            }
            
            response = self.session.put(f"{API_BASE_URL}/templates/{self.created_template_id}", 
                                      json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'fields' in data and isinstance(data['fields'], list):
                    if self.created_field_id in data['fields']:
                        self.log_result("Step 3: PUT /api/templates/{id} with valid field", True, 
                                      f"Successfully updated template with field {self.created_field_id}")
                        return True
                    else:
                        self.log_result("Step 3: PUT /api/templates/{id} with valid field", False, 
                                      f"Field {self.created_field_id} not found in response fields: {data['fields']}")
                        return False
                else:
                    self.log_result("Step 3: PUT /api/templates/{id} with valid field", False, 
                                  "Response missing fields array", data)
                    return False
            else:
                self.log_result("Step 3: PUT /api/templates/{id} with valid field", False, 
                              f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Step 3: PUT /api/templates/{id} with valid field", False, f"Exception: {str(e)}")
            return False

    def step_4_update_template_with_invalid_field(self):
        """Step 4: PUT /api/templates/{id} with additional non-existent field id -> expect 200, only existing fieldId remains"""
        if not self.created_template_id or not self.created_field_id:
            self.log_result("Step 4: PUT /api/templates/{id} with invalid field", False, 
                          "Missing template or field ID")
            return False
            
        try:
            # Include both existing field and non-existent field
            non_existent_field_id = "non-existent-field-id-12345"
            update_data = {
                "fields": [self.created_field_id, non_existent_field_id]
            }
            
            response = self.session.put(f"{API_BASE_URL}/templates/{self.created_template_id}", 
                                      json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'fields' in data and isinstance(data['fields'], list):
                    # Should only contain the existing field, non-existent field should be ignored
                    if (self.created_field_id in data['fields'] and 
                        non_existent_field_id not in data['fields'] and 
                        len(data['fields']) == 1):
                        self.log_result("Step 4: PUT /api/templates/{id} with invalid field", True, 
                                      f"Correctly ignored non-existent field, only {self.created_field_id} remains")
                        return True
                    else:
                        self.log_result("Step 4: PUT /api/templates/{id} with invalid field", False, 
                                      f"Unexpected fields in response: {data['fields']}. Expected only [{self.created_field_id}]")
                        return False
                else:
                    self.log_result("Step 4: PUT /api/templates/{id} with invalid field", False, 
                                  "Response missing fields array", data)
                    return False
            else:
                self.log_result("Step 4: PUT /api/templates/{id} with invalid field", False, 
                              f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Step 4: PUT /api/templates/{id} with invalid field", False, f"Exception: {str(e)}")
            return False

    def step_5_cleanup_resources(self):
        """Step 5: DELETE created resources (cleanup)"""
        cleanup_success = True
        
        # Delete template
        if self.created_template_id:
            try:
                response = self.session.delete(f"{API_BASE_URL}/templates/{self.created_template_id}")
                
                if response.status_code == 200:
                    # Verify template is deleted
                    get_response = self.session.get(f"{API_BASE_URL}/templates/{self.created_template_id}")
                    if get_response.status_code == 404:
                        self.log_result("Step 5a: DELETE template cleanup", True, 
                                      f"Successfully deleted template {self.created_template_id}")
                    else:
                        self.log_result("Step 5a: DELETE template cleanup", False, 
                                      "Template still exists after deletion")
                        cleanup_success = False
                else:
                    self.log_result("Step 5a: DELETE template cleanup", False, 
                                  f"HTTP {response.status_code}", response.text)
                    cleanup_success = False
                    
            except Exception as e:
                self.log_result("Step 5a: DELETE template cleanup", False, f"Exception: {str(e)}")
                cleanup_success = False
        
        # Delete field
        if self.created_field_id:
            try:
                response = self.session.delete(f"{API_BASE_URL}/fields/{self.created_field_id}")
                
                if response.status_code == 200:
                    # Verify field is deleted
                    get_response = self.session.get(f"{API_BASE_URL}/fields/{self.created_field_id}")
                    if get_response.status_code == 404:
                        self.log_result("Step 5b: DELETE field cleanup", True, 
                                      f"Successfully deleted field {self.created_field_id}")
                    else:
                        self.log_result("Step 5b: DELETE field cleanup", False, 
                                      "Field still exists after deletion")
                        cleanup_success = False
                else:
                    self.log_result("Step 5b: DELETE field cleanup", False, 
                                  f"HTTP {response.status_code}", response.text)
                    cleanup_success = False
                    
            except Exception as e:
                self.log_result("Step 5b: DELETE field cleanup", False, f"Exception: {str(e)}")
                cleanup_success = False
        
        return cleanup_success

    def check_for_5xx_errors(self):
        """Validate no 5xx errors occurred during testing"""
        server_errors = []
        for result in self.test_results:
            if 'response_data' in result and isinstance(result.get('details', ''), str):
                if 'HTTP 5' in result['details']:
                    server_errors.append(result)
        
        if server_errors:
            self.log_result("5xx Error Check", False, 
                          f"Found {len(server_errors)} server errors (5xx)")
            return False
        else:
            self.log_result("5xx Error Check", True, "No server errors (5xx) detected")
            return True

    def run_focused_test(self):
        """Run the focused PUT /api/templates/{id} SQLite FK test"""
        print(f"🎯 Starting Focused PUT /api/templates/{{id}} SQLite FK Test")
        print(f"Backend URL: {API_BASE_URL}")
        print("=" * 70)
        
        # Execute test steps in sequence
        step1_success = self.step_1_create_template()
        if not step1_success:
            print("❌ Step 1 failed, cannot continue with test")
            return False, True
        
        step2_success = self.step_2_create_field()
        if not step2_success:
            print("❌ Step 2 failed, cannot continue with test")
            return False, True
        
        step3_success = self.step_3_update_template_with_field()
        step4_success = self.step_4_update_template_with_invalid_field()
        
        # Always attempt cleanup
        step5_success = self.step_5_cleanup_resources()
        
        # Check for 5xx errors
        no_5xx_errors = self.check_for_5xx_errors()
        
        # Print summary
        print("=" * 70)
        print("📊 FOCUSED TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        # Key test results
        core_tests_passed = step3_success and step4_success and no_5xx_errors
        
        if core_tests_passed:
            print("\n🎉 CORE FK TEST RESULTS:")
            print("  ✅ PUT /api/templates/{id} with valid field: SUCCESS")
            print("  ✅ PUT /api/templates/{id} ignores invalid field: SUCCESS") 
            print("  ✅ No 5xx server errors: SUCCESS")
            print("\n✅ SQLite FK failure appears to be RESOLVED!")
        else:
            print("\n❌ CORE FK TEST RESULTS:")
            if not step3_success:
                print("  ❌ PUT /api/templates/{id} with valid field: FAILED")
            if not step4_success:
                print("  ❌ PUT /api/templates/{id} ignores invalid field: FAILED")
            if not no_5xx_errors:
                print("  ❌ Server errors (5xx) detected: FAILED")
            print("\n❌ SQLite FK issue may still exist!")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        return core_tests_passed, failed > 0

if __name__ == "__main__":
    tester = FocusedTemplateTester()
    core_success, has_failures = tester.run_focused_test()
    
    # Exit with error code if core tests failed
    sys.exit(0 if core_success else 1)