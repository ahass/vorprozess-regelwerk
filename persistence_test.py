#!/usr/bin/env python3
"""
C# Backend Persistence Validation Test
Tests SQLite persistence by creating templates and fields, associating them,
restarting the backend service, and verifying data persistence.
"""

import requests
import json
import os
import sys
import time
import subprocess
from typing import Dict, Any, List
from datetime import datetime

# Use localhost since C# backend is running locally
API_BASE_URL = "http://localhost:8001/api"

class PersistenceTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.template_a_id = None
        self.template_b_id = None
        self.field_x_id = None
        self.field_y_id = None
        
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

    def wait_for_backend(self, max_attempts=30, delay=2):
        """Wait for backend to be ready"""
        print("⏳ Waiting for C# backend to be ready...")
        for attempt in range(max_attempts):
            try:
                response = self.session.get(f"{API_BASE_URL}/")
                if response.status_code == 200:
                    print("✅ C# backend is ready!")
                    return True
            except requests.exceptions.RequestException:
                pass
            
            if attempt < max_attempts - 1:
                time.sleep(delay)
                print(f"    Attempt {attempt + 1}/{max_attempts}...")
        
        print("❌ Backend failed to start within timeout")
        return False

    def create_template_a(self):
        """Step 1: Create template A via API"""
        try:
            template_data = {
                "name": {
                    "de": "Template A Deutsch",
                    "fr": "Template A Français", 
                    "it": "Template A Italiano"
                },
                "description": {
                    "de": "Test Template A für Persistenz",
                    "fr": "Test Template A pour persistance",
                    "it": "Test Template A per persistenza"
                }
            }
            
            response = self.session.post(f"{API_BASE_URL}/templates", json=template_data)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if 'id' in data:
                    self.template_a_id = data['id']
                    self.log_result("Create Template A", True, 
                                  f"Created template A with ID: {data['id']}")
                    return True
                else:
                    self.log_result("Create Template A", False, 
                                  "Response missing ID field", data)
            else:
                self.log_result("Create Template A", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Create Template A", False, f"Exception: {str(e)}")
        
        return False

    def create_field_x(self):
        """Step 1: Create field X via API"""
        try:
            field_data = {
                "name": {
                    "de": "Field X Deutsch",
                    "fr": "Field X Français",
                    "it": "Field X Italiano"
                },
                "type": "text",
                "visibility": "editable",
                "requirement": "optional",
                "validation": {
                    "min_length": 1,
                    "max_length": 200
                }
            }
            
            response = self.session.post(f"{API_BASE_URL}/fields", json=field_data)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if 'id' in data:
                    self.field_x_id = data['id']
                    self.log_result("Create Field X", True, 
                                  f"Created field X with ID: {data['id']}")
                    return True
                else:
                    self.log_result("Create Field X", False, 
                                  "Response missing ID field", data)
            else:
                self.log_result("Create Field X", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Create Field X", False, f"Exception: {str(e)}")
        
        return False

    def associate_field_x_to_template_a(self):
        """Step 2: Associate field X to template A via PUT"""
        if not self.template_a_id or not self.field_x_id:
            self.log_result("Associate Field X to Template A", False, 
                          "Missing template A or field X ID")
            return False
            
        try:
            update_data = {
                "fields": [self.field_x_id]
            }
            
            response = self.session.put(f"{API_BASE_URL}/templates/{self.template_a_id}", 
                                      json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'fields' in data and self.field_x_id in data['fields']:
                    self.log_result("Associate Field X to Template A", True, 
                                  f"Successfully associated field X to template A")
                    return True
                else:
                    self.log_result("Associate Field X to Template A", False, 
                                  "Field X not found in template A fields", data)
            else:
                self.log_result("Associate Field X to Template A", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Associate Field X to Template A", False, f"Exception: {str(e)}")
        
        return False

    def verify_association_template_a(self):
        """Step 3: GET /api/templates and /api/templates/{id} to ensure association is present"""
        success = True
        
        # Test GET /api/templates
        try:
            response = self.session.get(f"{API_BASE_URL}/templates")
            
            if response.status_code == 200:
                data = response.json()
                template_a_found = False
                for template in data:
                    if template.get('id') == self.template_a_id:
                        template_a_found = True
                        if self.field_x_id in template.get('fields', []):
                            self.log_result("Verify Association - GET /api/templates", True, 
                                          f"Template A found with field X in templates list")
                        else:
                            self.log_result("Verify Association - GET /api/templates", False, 
                                          f"Template A found but field X missing from fields list")
                            success = False
                        break
                
                if not template_a_found:
                    self.log_result("Verify Association - GET /api/templates", False, 
                                  "Template A not found in templates list")
                    success = False
            else:
                self.log_result("Verify Association - GET /api/templates", False, 
                              f"HTTP {response.status_code}", response.text)
                success = False
                
        except Exception as e:
            self.log_result("Verify Association - GET /api/templates", False, f"Exception: {str(e)}")
            success = False

        # Test GET /api/templates/{id}
        try:
            response = self.session.get(f"{API_BASE_URL}/templates/{self.template_a_id}")
            
            if response.status_code == 200:
                data = response.json()
                if self.field_x_id in data.get('fields', []):
                    self.log_result("Verify Association - GET /api/templates/{id}", True, 
                                  f"Template A retrieved by ID with field X association")
                else:
                    self.log_result("Verify Association - GET /api/templates/{id}", False, 
                                  f"Template A retrieved but field X missing from fields")
                    success = False
            else:
                self.log_result("Verify Association - GET /api/templates/{id}", False, 
                              f"HTTP {response.status_code}", response.text)
                success = False
                
        except Exception as e:
            self.log_result("Verify Association - GET /api/templates/{id}", False, f"Exception: {str(e)}")
            success = False
        
        return success

    def create_template_b(self):
        """Step 4: Create template B"""
        try:
            template_data = {
                "name": {
                    "de": "Template B Deutsch",
                    "fr": "Template B Français", 
                    "it": "Template B Italiano"
                },
                "description": {
                    "de": "Test Template B für Persistenz",
                    "fr": "Test Template B pour persistance",
                    "it": "Test Template B per persistenza"
                }
            }
            
            response = self.session.post(f"{API_BASE_URL}/templates", json=template_data)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if 'id' in data:
                    self.template_b_id = data['id']
                    self.log_result("Create Template B", True, 
                                  f"Created template B with ID: {data['id']}")
                    return True
                else:
                    self.log_result("Create Template B", False, 
                                  "Response missing ID field", data)
            else:
                self.log_result("Create Template B", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Create Template B", False, f"Exception: {str(e)}")
        
        return False

    def create_field_y(self):
        """Step 4: Create field Y"""
        try:
            field_data = {
                "name": {
                    "de": "Field Y Deutsch",
                    "fr": "Field Y Français",
                    "it": "Field Y Italiano"
                },
                "type": "select",
                "visibility": "editable",
                "requirement": "required",
                "selectType": "radio",
                "options": [
                    {
                        "id": "opt1",
                        "label": {
                            "de": "Option 1",
                            "fr": "Option 1",
                            "it": "Opzione 1"
                        },
                        "value": "option1"
                    },
                    {
                        "id": "opt2",
                        "label": {
                            "de": "Option 2",
                            "fr": "Option 2",
                            "it": "Opzione 2"
                        },
                        "value": "option2"
                    }
                ]
            }
            
            response = self.session.post(f"{API_BASE_URL}/fields", json=field_data)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if 'id' in data:
                    self.field_y_id = data['id']
                    self.log_result("Create Field Y", True, 
                                  f"Created field Y with ID: {data['id']}")
                    return True
                else:
                    self.log_result("Create Field Y", False, 
                                  "Response missing ID field", data)
            else:
                self.log_result("Create Field Y", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Create Field Y", False, f"Exception: {str(e)}")
        
        return False

    def associate_field_y_to_template_b(self):
        """Step 4: Associate field Y to template B via PUT"""
        if not self.template_b_id or not self.field_y_id:
            self.log_result("Associate Field Y to Template B", False, 
                          "Missing template B or field Y ID")
            return False
            
        try:
            update_data = {
                "fields": [self.field_y_id]
            }
            
            response = self.session.put(f"{API_BASE_URL}/templates/{self.template_b_id}", 
                                      json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'fields' in data and self.field_y_id in data['fields']:
                    self.log_result("Associate Field Y to Template B", True, 
                                  f"Successfully associated field Y to template B")
                    return True
                else:
                    self.log_result("Associate Field Y to Template B", False, 
                                  "Field Y not found in template B fields", data)
            else:
                self.log_result("Associate Field Y to Template B", False, 
                              f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Associate Field Y to Template B", False, f"Exception: {str(e)}")
        
        return False

    def restart_csharp_backend(self):
        """Step 5: Restart csharp-backend service via supervisor"""
        try:
            print("🔄 Restarting C# backend service...")
            
            # Stop the service
            result = subprocess.run(['sudo', 'supervisorctl', 'stop', 'csharp-backend'], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                self.log_result("Restart C# Backend - Stop", False, 
                              f"Failed to stop service: {result.stderr}")
                return False
            
            time.sleep(2)  # Brief pause
            
            # Start the service
            result = subprocess.run(['sudo', 'supervisorctl', 'start', 'csharp-backend'], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                self.log_result("Restart C# Backend - Start", False, 
                              f"Failed to start service: {result.stderr}")
                return False
            
            # Wait for backend to be ready
            if self.wait_for_backend():
                self.log_result("Restart C# Backend", True, 
                              "Successfully restarted C# backend service")
                return True
            else:
                self.log_result("Restart C# Backend", False, 
                              "Service restarted but backend not responding")
                return False
                
        except subprocess.TimeoutExpired:
            self.log_result("Restart C# Backend", False, "Supervisor command timed out")
            return False
        except Exception as e:
            self.log_result("Restart C# Backend", False, f"Exception: {str(e)}")
            return False

    def verify_persistence_after_restart(self):
        """Step 5: GET templates again to confirm persistence in SQLite"""
        success = True
        
        # Verify both templates and their field associations persist
        try:
            response = self.session.get(f"{API_BASE_URL}/templates")
            
            if response.status_code == 200:
                data = response.json()
                template_a_found = False
                template_b_found = False
                
                for template in data:
                    if template.get('id') == self.template_a_id:
                        template_a_found = True
                        if self.field_x_id in template.get('fields', []):
                            self.log_result("Persistence Check - Template A", True, 
                                          f"Template A and field X association persisted after restart")
                        else:
                            self.log_result("Persistence Check - Template A", False, 
                                          f"Template A persisted but field X association lost")
                            success = False
                    
                    elif template.get('id') == self.template_b_id:
                        template_b_found = True
                        if self.field_y_id in template.get('fields', []):
                            self.log_result("Persistence Check - Template B", True, 
                                          f"Template B and field Y association persisted after restart")
                        else:
                            self.log_result("Persistence Check - Template B", False, 
                                          f"Template B persisted but field Y association lost")
                            success = False
                
                if not template_a_found:
                    self.log_result("Persistence Check - Template A", False, 
                                  "Template A not found after restart")
                    success = False
                
                if not template_b_found:
                    self.log_result("Persistence Check - Template B", False, 
                                  "Template B not found after restart")
                    success = False
                    
            else:
                self.log_result("Persistence Check", False, 
                              f"HTTP {response.status_code}", response.text)
                success = False
                
        except Exception as e:
            self.log_result("Persistence Check", False, f"Exception: {str(e)}")
            success = False

        # Also verify individual template retrieval
        for template_id, template_name, field_id, field_name in [
            (self.template_a_id, "Template A", self.field_x_id, "Field X"),
            (self.template_b_id, "Template B", self.field_y_id, "Field Y")
        ]:
            try:
                response = self.session.get(f"{API_BASE_URL}/templates/{template_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    if field_id in data.get('fields', []):
                        self.log_result(f"Persistence Check - GET {template_name} by ID", True, 
                                      f"{template_name} retrieved by ID with {field_name} association after restart")
                    else:
                        self.log_result(f"Persistence Check - GET {template_name} by ID", False, 
                                      f"{template_name} retrieved but {field_name} association lost")
                        success = False
                else:
                    self.log_result(f"Persistence Check - GET {template_name} by ID", False, 
                                  f"HTTP {response.status_code}", response.text)
                    success = False
                    
            except Exception as e:
                self.log_result(f"Persistence Check - GET {template_name} by ID", False, f"Exception: {str(e)}")
                success = False
        
        return success

    def cleanup_test_data(self):
        """Clean up test data"""
        print("🧹 Cleaning up test data...")
        
        # Delete templates (this should also clean up associations)
        for template_id, template_name in [(self.template_a_id, "Template A"), (self.template_b_id, "Template B")]:
            if template_id:
                try:
                    response = self.session.delete(f"{API_BASE_URL}/templates/{template_id}")
                    if response.status_code == 200:
                        print(f"    ✅ Deleted {template_name}")
                    else:
                        print(f"    ⚠️ Failed to delete {template_name}: HTTP {response.status_code}")
                except Exception as e:
                    print(f"    ⚠️ Exception deleting {template_name}: {str(e)}")
        
        # Delete fields
        for field_id, field_name in [(self.field_x_id, "Field X"), (self.field_y_id, "Field Y")]:
            if field_id:
                try:
                    response = self.session.delete(f"{API_BASE_URL}/fields/{field_id}")
                    if response.status_code == 200:
                        print(f"    ✅ Deleted {field_name}")
                    else:
                        print(f"    ⚠️ Failed to delete {field_name}: HTTP {response.status_code}")
                except Exception as e:
                    print(f"    ⚠️ Exception deleting {field_name}: {str(e)}")

    def run_persistence_test(self):
        """Run the complete persistence validation test"""
        print(f"🚀 Starting C# Backend Persistence Validation Test")
        print(f"Backend URL: {API_BASE_URL}")
        print("=" * 70)
        
        # Ensure backend is ready
        if not self.wait_for_backend():
            print("❌ Backend not ready, aborting test")
            return False, len(self.test_results)
        
        # Step 1: Create template A and field X
        print("📝 Step 1: Creating Template A and Field X...")
        if not (self.create_template_a() and self.create_field_x()):
            print("❌ Failed to create initial resources")
            return False, len(self.test_results)
        
        # Step 2: Associate field X to template A
        print("🔗 Step 2: Associating Field X to Template A...")
        if not self.associate_field_x_to_template_a():
            print("❌ Failed to associate field X to template A")
            return False, len(self.test_results)
        
        # Step 3: Verify association
        print("✅ Step 3: Verifying association...")
        if not self.verify_association_template_a():
            print("❌ Failed to verify association")
            return False, len(self.test_results)
        
        # Step 4: Create template B and field Y, then associate
        print("📝 Step 4: Creating Template B and Field Y, then associating...")
        if not (self.create_template_b() and self.create_field_y() and self.associate_field_y_to_template_b()):
            print("❌ Failed to create template B and field Y or associate them")
            return False, len(self.test_results)
        
        # Step 5: Restart backend and verify persistence
        print("🔄 Step 5: Restarting backend and verifying persistence...")
        if not self.restart_csharp_backend():
            print("❌ Failed to restart backend")
            return False, len(self.test_results)
        
        if not self.verify_persistence_after_restart():
            print("❌ Persistence verification failed")
            return False, len(self.test_results)
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary
        print("=" * 70)
        print("📊 PERSISTENCE TEST SUMMARY")
        print("=" * 70)
        
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
        else:
            print("\n🎉 ALL PERSISTENCE TESTS PASSED!")
            print("✅ SQLite database correctly persists template-field associations across service restarts")
        
        return failed == 0, len(self.test_results)

if __name__ == "__main__":
    tester = PersistenceTester()
    success, total_tests = tester.run_persistence_test()
    
    # Exit with error code if tests failed
    sys.exit(0 if success else 1)