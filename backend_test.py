import requests
import sys
import json
import subprocess
from datetime import datetime
import time

class SafeHerAPITester:
    def __init__(self, base_url="https://hersafety-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_contact_id = None
        self.test_alert_id = None
        self.test_report_id = None

    def setup_test_user(self):
        """Create test user and session in MongoDB"""
        print("🔧 Setting up test user and session...")
        
        timestamp = int(time.time())
        user_id = f"test-user-{timestamp}"
        session_token = f"test_session_{timestamp}"
        
        mongo_script = f"""
        use('test_database');
        var userId = '{user_id}';
        var sessionToken = '{session_token}';
        db.users.insertOne({{
          user_id: userId,
          email: 'test.user.{timestamp}@example.com',
          name: 'Test User',
          picture: 'https://via.placeholder.com/150',
          created_at: new Date(),
          emergency_settings: {{
            auto_detect: true,
            alert_contacts: true,
            share_location: true,
            fake_call_enabled: true
          }}
        }});
        db.user_sessions.insertOne({{
          user_id: userId,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 7*24*60*60*1000),
          created_at: new Date()
        }});
        print('Setup complete');
        """
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                self.session_token = session_token
                self.user_id = user_id
                print(f"✅ Test user created: {user_id}")
                print(f"✅ Session token: {session_token}")
                return True
            else:
                print(f"❌ MongoDB setup failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ MongoDB setup error: {str(e)}")
            return False

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints")
        
        # Test /auth/me with valid token
        success, response = self.run_test(
            "Get Current User (/auth/me)",
            "GET", "auth/me", 200
        )
        
        if success and response:
            print(f"   User ID: {response.get('user_id')}")
            print(f"   Email: {response.get('email')}")
            print(f"   Name: {response.get('name')}")
        
        return success

    def test_emergency_contacts(self):
        """Test emergency contacts CRUD operations"""
        print("\n👥 Testing Emergency Contacts")
        
        # Get contacts (should be empty initially)
        success, contacts = self.run_test(
            "Get Emergency Contacts",
            "GET", "emergency/contacts", 200
        )
        
        if success:
            print(f"   Initial contacts count: {len(contacts)}")
        
        # Create a new contact
        contact_data = {
            "name": "Emergency Contact Test",
            "relationship": "Friend",
            "phone": "+1234567890",
            "email": "emergency@test.com",
            "is_primary": True
        }
        
        success, contact = self.run_test(
            "Create Emergency Contact",
            "POST", "emergency/contacts", 201, contact_data
        )
        
        if success and contact:
            self.test_contact_id = contact.get('contact_id')
            print(f"   Created contact ID: {self.test_contact_id}")
        
        # Get contacts again (should have 1 now)
        success, contacts = self.run_test(
            "Get Emergency Contacts (after create)",
            "GET", "emergency/contacts", 200
        )
        
        if success:
            print(f"   Contacts count after create: {len(contacts)}")
        
        # Delete the contact
        if self.test_contact_id:
            success, _ = self.run_test(
                "Delete Emergency Contact",
                "DELETE", f"emergency/contacts/{self.test_contact_id}", 200
            )

    def test_emergency_alerts(self):
        """Test emergency alert system"""
        print("\n🚨 Testing Emergency Alerts")
        
        # Check for active emergency (should be none)
        success, alert = self.run_test(
            "Get Active Emergency",
            "GET", "emergency/active", 200
        )
        
        # Trigger emergency
        emergency_data = {
            "type": "manual",
            "location": {
                "latitude": 28.6139,
                "longitude": 77.2090,
                "address": "Test Location"
            },
            "evidence": ["test_evidence.jpg"]
        }
        
        success, alert = self.run_test(
            "Trigger Emergency",
            "POST", "emergency/trigger", 201, emergency_data
        )
        
        if success and alert:
            self.test_alert_id = alert.get('alert_id')
            print(f"   Created alert ID: {self.test_alert_id}")
            print(f"   Alert status: {alert.get('status')}")
        
        # Check active emergency again
        success, active_alert = self.run_test(
            "Get Active Emergency (after trigger)",
            "GET", "emergency/active", 200
        )
        
        # Resolve emergency
        if self.test_alert_id:
            success, _ = self.run_test(
                "Resolve Emergency",
                "POST", f"emergency/resolve/{self.test_alert_id}", 200
            )

    def test_community_reports(self):
        """Test community reporting system"""
        print("\n📝 Testing Community Reports")
        
        # Submit a report
        report_data = {
            "type": "harassment",
            "severity": 3,
            "location": {
                "latitude": 28.6139,
                "longitude": 77.2090,
                "address": "Test Report Location"
            },
            "description": "Test incident report for API testing",
            "anonymous": True
        }
        
        success, report = self.run_test(
            "Submit Community Report",
            "POST", "community/reports", 201, report_data
        )
        
        if success and report:
            self.test_report_id = report.get('report_id')
            print(f"   Created report ID: {self.test_report_id}")
        
        # Get reports
        success, reports = self.run_test(
            "Get Community Reports",
            "GET", "community/reports", 200
        )
        
        if success:
            print(f"   Total reports: {len(reports)}")

    def test_safety_zones(self):
        """Test safety zones functionality"""
        print("\n🏥 Testing Safety Zones")
        
        # Seed safety zones first
        success, _ = self.run_test(
            "Seed Safety Zones",
            "POST", "admin/seed-zones", 200
        )
        
        # Get all safety zones
        success, zones = self.run_test(
            "Get Safety Zones",
            "GET", "safety/zones", 200
        )
        
        if success:
            print(f"   Total safety zones: {len(zones)}")
            for zone in zones[:3]:  # Show first 3
                print(f"   - {zone.get('name')} ({zone.get('type')})")
        
        # Test nearby zones
        nearby_data = {
            "latitude": 28.6139,
            "longitude": 77.2090,
            "radius": 5000
        }
        
        success, nearby = self.run_test(
            "Get Nearby Safety Zones",
            "POST", "safety/zones/nearby", 200, nearby_data
        )
        
        if success:
            print(f"   Nearby zones: {len(nearby)}")

    def test_fake_call(self):
        """Test fake call generation"""
        print("\n📞 Testing Fake Call")
        
        fake_call_data = {
            "caller_name": "Mom"
        }
        
        success, call_data = self.run_test(
            "Generate Fake Call",
            "POST", "fake-call", 200, fake_call_data
        )
        
        if success and call_data:
            print(f"   Caller: {call_data.get('caller')}")
            print(f"   Message: {call_data.get('message')}")
            print(f"   Duration: {call_data.get('duration')}s")

    def test_ai_distress_detection(self):
        """Test AI distress detection with Gemini 3 Flash"""
        print("\n🤖 Testing AI Distress Detection")
        
        # Test with distress text
        distress_data = {
            "text": "Help! Someone is following me and I'm scared",
            "location": {
                "latitude": 28.6139,
                "longitude": 77.2090
            }
        }
        
        success, analysis = self.run_test(
            "Analyze Distress Text",
            "POST", "ai/analyze-distress", 200, distress_data
        )
        
        if success and analysis:
            print(f"   Distress level: {analysis.get('distress_level')}")
            print(f"   Triggers: {analysis.get('triggers')}")
            print(f"   Recommendation: {analysis.get('recommendation')}")
            print(f"   Confidence: {analysis.get('confidence')}")
        
        # Test with normal text
        normal_data = {
            "text": "Just arrived at the coffee shop, having a great day!"
        }
        
        success, analysis = self.run_test(
            "Analyze Normal Text",
            "POST", "ai/analyze-distress", 200, normal_data
        )
        
        if success and analysis:
            print(f"   Distress level: {analysis.get('distress_level')}")

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up test data...")
        
        if not self.user_id:
            return
            
        cleanup_script = f"""
        use('test_database');
        db.users.deleteMany({{"user_id": "{self.user_id}"}});
        db.user_sessions.deleteMany({{"user_id": "{self.user_id}"}});
        db.emergency_contacts.deleteMany({{"user_id": "{self.user_id}"}});
        db.emergency_alerts.deleteMany({{"user_id": "{self.user_id}"}});
        print('Cleanup complete');
        """
        
        try:
            subprocess.run(['mongosh', '--eval', cleanup_script], 
                          capture_output=True, text=True, timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting SafeHer API Tests")
        print(f"Backend URL: {self.base_url}")
        
        # Setup test user
        if not self.setup_test_user():
            print("❌ Failed to setup test user, aborting tests")
            return 1
        
        try:
            # Run all test suites
            self.test_auth_endpoints()
            self.test_emergency_contacts()
            self.test_emergency_alerts()
            self.test_community_reports()
            self.test_safety_zones()
            self.test_fake_call()
            self.test_ai_distress_detection()
            
        finally:
            # Always cleanup
            self.cleanup_test_data()
        
        # Print results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = SafeHerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())