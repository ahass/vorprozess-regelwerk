#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

---
user_problem_statement: >-
  Final API compatibility check between the migrated C# ASP.NET Core backend and the existing React frontend.
  Ensure all routes are prefixed with /api and that the frontend only calls the backend via REACT_APP_BACKEND_URL.
backend:
  - task: "Templates API (list/get/create/update/delete/render/simulate)"
    implemented: true
    working: NA
    file: "/app/backend-csharp/VorprozessRegelwerk.API/Controllers/TemplatesController.cs"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Initiating final API compatibility testing for Templates endpoints."
  - task: "Fields API (list/get/create/update/delete/validate-field/validation-schema)"
    implemented: true
    working: NA
    file: "/app/backend-csharp/VorprozessRegelwerk.API/Controllers/FieldsController.cs"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Initiating final API compatibility testing for Fields endpoints."
  - task: "ChangeLog API (list/entity-history)"
    implemented: true
    working: NA
    file: "/app/backend-csharp/VorprozessRegelwerk.API/Controllers/ChangeLogController.cs"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Initiating final API compatibility testing for ChangeLog endpoints."
frontend:
  - task: "TemplateOverview page loads templates from /api/templates"
    implemented: true
    working: NA
    file: "/app/frontend/src/pages/TemplateOverview.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Will verify list render and API call."
  - task: "TemplateBuilder basic CRUD via /api/templates and /api/fields"
    implemented: true
    working: NA
    file: "/app/frontend/src/pages/TemplateBuilder.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Will verify create/update/delete flows minimally."
  - task: "EnhancedTemplateBuilder tabs render and data flows"
    implemented: true
    working: NA
    file: "/app/frontend/src/pages/EnhancedTemplateBuilder.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Will verify Builder/Simulator/Dependencies tabs load and basic interactions."
  - task: "RoleSimulator uses /api/templates/simulate"
    implemented: true
    working: NA
    file: "/app/frontend/src/pages/RoleSimulator.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Will verify simulation request and visible fields count display."
  - task: "ChangeLog page loads from /api/changelog"
    implemented: true
    working: NA
    file: "/app/frontend/src/pages/ChangeLog.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Will verify changelog list fetch."
metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "Final API compatibility check (C# backend + React frontend)"
    - "Critical endpoints alignment vs README"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: >-
      Updating test plan and invoking automated backend tests first; after backend results,
      UI tests will be executed as requested by user. Ensure all API routes use /api prefix and
      frontend uses REACT_APP_BACKEND_URL.
---
