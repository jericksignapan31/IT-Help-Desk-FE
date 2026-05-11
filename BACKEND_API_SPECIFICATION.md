# 🔧 BACKEND API SPECIFICATION

Complete list of all API endpoints required by the IT Help Desk Frontend application.

---

## 📚 Table of Contents
1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [Tickets](#tickets)
4. [Assets](#assets)
5. [Employees](#employees)
6. [Branches](#branches)
7. [Departments](#departments)
8. [Brands](#brands)
9. [Repair Logs](#repair-logs)
10. [User Accounts](#user-accounts)

---

## 🔐 Authentication

### POST /auth/login
**Description:** User login  
**Authentication:** None  
**Status:** ✅ Working (with CORS issues)

**Request Body:**
```json
{
  "username": "john.doe",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "username": "john.doe",
    "email": "john@example.com",
    "role": "admin",
    "is_verified": true,
    "is_active": true
  }
}
```

**Error (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

**Error (403):**
```json
{
  "statusCode": 403,
  "message": "Account not verified. Please contact administrator."
}
```

---

### POST /auth/signup
**Description:** User registration  
**Authentication:** None

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "first_name": "John",
  "last_name": "Doe",
  "middle_name": "P",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "branch_id": 1,
  "department_id": 1,
  "position": "Software Developer",
  "contact_number": "09123456789",
  "role": "employee"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "username": "john.doe",
  "email": "john@example.com",
  "role": "employee",
  "is_verified": false,
  "message": "Registration successful. Please wait for admin verification."
}
```

---

### GET /auth/profile
**Description:** Get current user profile  
**Authentication:** Required (Bearer Token)

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "john.doe",
  "email": "john@example.com",
  "role": "admin",
  "is_verified": true,
  "is_active": true,
  "employee": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "branch_id": 1,
    "department_id": 1
  }
}
```

---

### POST /auth/change-password
**Description:** Change user password  
**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "old_password": "CurrentPassword123",
  "new_password": "NewPassword@456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

---

## 📊 Dashboard

### GET /dashboard/stats
**Description:** Get dashboard statistics  
**Authentication:** Required (Bearer Token)  
**Status:** 🔴 **NOT WORKING - RETURNS 500**

**Response (200 OK):**
```json
{
  "totalTickets": 127,
  "openTickets": 34,
  "pendingRepairs": 8,
  "assetsInUse": 156,
  "ticketsByStatus": {
    "open": 23,
    "in-progress": 11,
    "resolved": 67,
    "closed": 26
  },
  "ticketsByPriority": {
    "low": 45,
    "medium": 52,
    "high": 28,
    "urgent": 2
  },
  "assetsByCondition": {
    "excellent": 89,
    "good": 102,
    "fair": 38,
    "poor": 12,
    "broken": 3
  },
  "recentTickets": []
}
```

**SQL Queries Required:**
```sql
-- Total Tickets
SELECT COUNT(*) as totalTickets FROM tickets;

-- Open Tickets (non-closed)
SELECT COUNT(*) as openTickets FROM tickets WHERE status != 'CLOSED';

-- Tickets by Status
SELECT 
  CASE 
    WHEN status = 'PENDING_APPROVAL' THEN 'open'
    WHEN status = 'IN_PROGRESS' THEN 'in-progress'
    WHEN status = 'RESOLVED' THEN 'resolved'
    WHEN status = 'CLOSED' THEN 'closed'
  END as status,
  COUNT(*) as count
FROM tickets
GROUP BY status;

-- Tickets by Priority
SELECT LOWER(priority) as priority, COUNT(*) as count
FROM tickets
GROUP BY priority;

-- Assets in Use
SELECT COUNT(*) as assetsInUse FROM assets WHERE status = 'IN_USE';

-- Pending Repairs
SELECT COUNT(*) as pendingRepairs FROM assets WHERE status = 'MAINTENANCE';

-- Assets by Condition
SELECT LOWER(condition) as condition, COUNT(*) as count
FROM assets
GROUP BY condition;
```

**Implementation Checklist:**
- [ ] Create endpoint
- [ ] Query total tickets
- [ ] Query open tickets
- [ ] Query tickets by status (return all status keys)
- [ ] Query tickets by priority (return all priority keys)
- [ ] Query assets in use
- [ ] Query pending repairs
- [ ] Query assets by condition (return all condition keys)
- [ ] Return JSON response with all required fields

---

## 🎫 Tickets

### GET /tickets
**Description:** Get all tickets  
**Authentication:** Required (Bearer Token)

**Query Parameters:**
```
?status=PENDING_APPROVAL
?priority=HIGH
?search=keyword
?page=1
?limit=10
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "ticket_number": "TKT-001",
    "title": "Printer not working",
    "description": "Office printer on 3rd floor is not printing",
    "status": "PENDING_APPROVAL",
    "priority": "HIGH",
    "category": "HARDWARE",
    "reporter_id": 5,
    "assignee_id": null,
    "approver_id": null,
    "attachment_url": null,
    "created_at": "2026-05-10T10:30:00Z",
    "updated_at": "2026-05-10T10:30:00Z"
  }
]
```

---

### GET /tickets/:id
**Description:** Get specific ticket  
**Authentication:** Required (Bearer Token)

**Response (200 OK):** Same as above single object

---

### POST /tickets
**Description:** Create new ticket  
**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "title": "Printer not working",
  "description": "Office printer on 3rd floor is not printing",
  "priority": "HIGH",
  "category": "HARDWARE",
  "attachment_url": null
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "ticket_number": "TKT-001",
  "title": "Printer not working",
  "status": "PENDING_APPROVAL",
  "created_at": "2026-05-10T10:30:00Z"
}
```

---

### PATCH /tickets/:id
**Description:** Update ticket  
**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "MEDIUM",
  "status": "IN_PROGRESS",
  "assignee_id": 3
}
```

**Response (200 OK):** Updated ticket object

---

### DELETE /tickets/:id
**Description:** Delete ticket  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "message": "Ticket deleted successfully"
}
```

---

### GET /tickets/reporter/:employeeId
**Description:** Get tickets created by specific employee  
**Authentication:** Required (Bearer Token)

**Response (200 OK):** Array of tickets

---

### GET /tickets/assignee/:employeeId
**Description:** Get tickets assigned to specific employee  
**Authentication:** Required (Bearer Token)

**Response (200 OK):** Array of tickets

---

### GET /tickets/status/:status
**Description:** Get tickets by status  
**Authentication:** Required (Bearer Token)

**Response (200 OK):** Array of tickets

---

### GET /tickets/priority/:priority
**Description:** Get tickets by priority  
**Authentication:** Required (Bearer Token)

**Response (200 OK):** Array of tickets

---

### GET /tickets/search
**Description:** Search tickets  
**Authentication:** Required (Bearer Token)

**Query Parameters:**
```
?q=printer
```

**Response (200 OK):** Array of matching tickets

---

## 🖥️ Assets

### GET /assets
**Description:** Get all assets  
**Authentication:** Required (Bearer Token)

**Query Parameters:**
```
?type=COMPUTER
?status=IN_USE
?branch_id=1
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "asset_tag": "AST-001",
    "name": "Dell Desktop Computer",
    "type": "COMPUTER",
    "status": "IN_USE",
    "condition": "excellent",
    "brand_id": 1,
    "assigned_to_id": 5,
    "ip_address": "192.168.1.100",
    "mac_address": "00:1A:2B:3C:4D:5E",
    "hostname": "PC-DESKTOP-01",
    "anydesk_id": "123456789",
    "cpu": "Intel Core i7",
    "ram": "16GB",
    "storage": "512GB SSD",
    "display": "24 inch",
    "os": "Windows 10 Pro",
    "purchase_date": "2024-01-15",
    "warranty_expiry": "2026-01-15",
    "notes": "Main office desktop",
    "created_at": "2026-01-15T00:00:00Z"
  }
]
```

---

### GET /assets/:id
**Description:** Get specific asset  
**Authentication:** Required (Bearer Token)

**Response (200 OK):** Single asset object

---

### POST /assets
**Description:** Create new asset  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin/IT only

**Request Body:**
```json
{
  "asset_tag": "AST-001",
  "name": "Dell Desktop Computer",
  "type": "COMPUTER",
  "condition": "excellent",
  "brand_id": 1,
  "assigned_to_id": null,
  "ip_address": "192.168.1.100",
  "mac_address": "00:1A:2B:3C:4D:5E",
  "hostname": "PC-DESKTOP-01",
  "cpu": "Intel Core i7",
  "ram": "16GB",
  "storage": "512GB SSD",
  "display": "24 inch",
  "os": "Windows 10 Pro",
  "purchase_date": "2024-01-15",
  "warranty_expiry": "2026-01-15"
}
```

**Response (201 Created):** New asset object

---

### PATCH /assets/:id
**Description:** Update asset  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin/IT only

**Response (200 OK):** Updated asset object

---

### DELETE /assets/:id
**Description:** Delete asset  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "message": "Asset deleted successfully"
}
```

---

## 👥 Employees

### GET /employees
**Description:** Get all employees  
**Authentication:** Required (Bearer Token)

**Query Parameters:**
```
?branch_id=1
?department_id=2
?employment_status=true
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "employee_id": "EMP001",
    "first_name": "John",
    "last_name": "Doe",
    "middle_name": "P",
    "email": "john@example.com",
    "position": "Software Developer",
    "contact_number": "09123456789",
    "branch_id": 1,
    "department_id": 1,
    "employment_status": true,
    "branch": { "id": 1, "name": "Manila Branch" },
    "department": { "id": 1, "name": "IT Department" },
    "created_at": "2026-01-15T00:00:00Z"
  }
]
```

---

### GET /employees/:id
**Description:** Get specific employee  
**Authentication:** Required (Bearer Token)

**Response (200 OK):** Single employee object

---

### POST /employees
**Description:** Create new employee  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "first_name": "John",
  "last_name": "Doe",
  "middle_name": "P",
  "email": "john@example.com",
  "position": "Software Developer",
  "contact_number": "09123456789",
  "branch_id": 1,
  "department_id": 1
}
```

**Response (201 Created):** New employee object

---

### PATCH /employees/:id
**Description:** Update employee  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):** Updated employee object

---

### DELETE /employees/:id
**Description:** Delete employee  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "message": "Employee deleted successfully"
}
```

---

### PATCH /employees/:id/status
**Description:** Toggle employee employment status  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Request Body:**
```json
{
  "employment_status": false
}
```

**Response (200 OK):** Updated employee object

---

### PATCH /employees/:id/verify
**Description:** Verify employee account  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Request Body:**
```json
{
  "is_verified": true
}
```

**Response (200 OK):** Updated employee object

---

### PATCH /employees/:id/reset-password
**Description:** Reset employee password  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Request Body:**
```json
{
  "newPassword": "NewPassword@123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

---

## 🏢 Branches

### GET /branches
**Description:** Get all branches  
**Authentication:** Required (Bearer Token)  
**Status:** 🔴 **NOT WORKING - RETURNS 500**

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Manila Branch",
    "address": "123 Main St, Manila",
    "phone": "02-1234-5678",
    "contact_person": "Maria Santos",
    "city": "Manila",
    "region": "NCR",
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

**Implementation Checklist:**
- [ ] Query all branches from database
- [ ] Return array of branch objects
- [ ] Ensure all required fields are included

---

### GET /branches/:id
**Description:** Get specific branch  
**Authentication:** Required (Bearer Token)

**Response (200 OK):** Single branch object

---

### POST /branches
**Description:** Create new branch  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Request Body:**
```json
{
  "name": "Manila Branch",
  "address": "123 Main St, Manila",
  "phone": "02-1234-5678",
  "contact_person": "Maria Santos",
  "city": "Manila",
  "region": "NCR"
}
```

**Response (201 Created):** New branch object

---

### PATCH /branches/:id
**Description:** Update branch  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):** Updated branch object

---

### DELETE /branches/:id
**Description:** Delete branch  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "message": "Branch deleted successfully"
}
```

---

## 🏭 Departments

### GET /departments
**Description:** Get all departments  
**Authentication:** Required (Bearer Token)  
**Status:** 🔴 **NOT WORKING - RETURNS 500**

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "IT Department",
    "description": "Information Technology",
    "head_id": 2,
    "budget": 500000,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

**Implementation Checklist:**
- [ ] Query all departments from database
- [ ] Return array of department objects
- [ ] Ensure all required fields are included

---

### GET /departments/:id
**Description:** Get specific department  
**Authentication:** Required (Bearer Token)

**Response (200 OK):** Single department object

---

### POST /departments
**Description:** Create new department  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Request Body:**
```json
{
  "name": "IT Department",
  "description": "Information Technology",
  "head_id": 2,
  "budget": 500000
}
```

**Response (201 Created):** New department object

---

### PATCH /departments/:id
**Description:** Update department  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):** Updated department object

---

### DELETE /departments/:id
**Description:** Delete department  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "message": "Department deleted successfully"
}
```

---

## 🏷️ Brands

### GET /brands
**Description:** Get all brands  
**Authentication:** Required (Bearer Token)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Dell",
    "description": "Dell Technologies",
    "image_url": "https://example.com/dell-logo.png",
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

### GET /brands/:id
**Description:** Get specific brand  
**Authentication:** Required (Bearer Token)

**Response (200 OK):** Single brand object

---

### POST /brands
**Description:** Create new brand  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Request Body:**
```json
{
  "name": "Dell",
  "description": "Dell Technologies",
  "image_url": "https://example.com/dell-logo.png"
}
```

**Response (201 Created):** New brand object

---

### PATCH /brands/:id
**Description:** Update brand  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):** Updated brand object

---

### DELETE /brands/:id
**Description:** Delete brand  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "message": "Brand deleted successfully"
}
```

---

## 🔧 Repair Logs

### GET /repair-logs
**Description:** Get all repair logs  
**Authentication:** Required (Bearer Token)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "asset_id": 1,
    "issue_description": "Screen flickering",
    "resolution": "Replaced GPU",
    "repair_date": "2026-05-10",
    "technician_id": 3,
    "cost": 5000,
    "created_at": "2026-05-10T00:00:00Z"
  }
]
```

---

### GET /repair-logs/:id
**Description:** Get specific repair log  
**Authentication:** Required (Bearer Token)

**Response (200 OK):** Single repair log object

---

### POST /repair-logs
**Description:** Create new repair log  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin/IT only

**Request Body:**
```json
{
  "asset_id": 1,
  "issue_description": "Screen flickering",
  "resolution": "Replaced GPU",
  "repair_date": "2026-05-10",
  "cost": 5000
}
```

**Response (201 Created):** New repair log object

---

### PATCH /repair-logs/:id
**Description:** Update repair log  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin/IT only

**Response (200 OK):** Updated repair log object

---

### DELETE /repair-logs/:id
**Description:** Delete repair log  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "message": "Repair log deleted successfully"
}
```

---

## 👤 User Accounts

### GET /user-credentials
**Description:** Get all user accounts  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "username": "john.doe",
    "email": "john@example.com",
    "role": "admin",
    "is_verified": true,
    "is_active": true,
    "employee_id": 1,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

### GET /user-credentials/:id
**Description:** Get specific user account  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Response (200 OK):** Single user account object

---

### PATCH /user-credentials/:id/status
**Description:** Activate/Deactivate user account  
**Authentication:** Required (Bearer Token)  
**Authorization:** Admin only

**Request Body:**
```json
{
  "is_active": false
}
```

**Response (200 OK):** Updated user account object

---

## ⚠️ CRITICAL ISSUES TO FIX

### 🔴 500 Errors on Endpoints:
1. **GET /branches** - Database query failing
2. **GET /departments** - Database query failing
3. **GET /dashboard/stats** - Endpoint not implemented or broken

### 🟡 CORS Issues:
- Ensure all endpoints return proper CORS headers:
  ```
  Access-Control-Allow-Origin: https://it-help-desk-fe.vercel.app
  Access-Control-Allow-Credentials: true
  Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  ```

### 🟠 Authentication:
- All endpoints (except /auth/login and /auth/signup) require Bearer token
- Token should be sent in Authorization header: `Authorization: Bearer <token>`

---

## 🧪 Testing Endpoints with cURL

### Test Branches Endpoint
```bash
curl -X GET https://ticketing-web-app.onrender.com/branches \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"
```

### Test Dashboard Stats Endpoint
```bash
curl -X GET https://ticketing-web-app.onrender.com/dashboard/stats \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"
```

### Test Departments Endpoint
```bash
curl -X GET https://ticketing-web-app.onrender.com/departments \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"
```

---

## 📝 Implementation Priority

### Priority 1 (CRITICAL - Blocking Features):
- [ ] Fix GET /branches (500 error)
- [ ] Fix GET /departments (500 error)
- [ ] Implement GET /dashboard/stats

### Priority 2 (High - Core Features):
- [ ] GET /tickets
- [ ] POST /tickets
- [ ] PATCH /tickets/:id
- [ ] GET /assets
- [ ] POST /assets

### Priority 3 (Medium - Admin Features):
- [ ] Employee management endpoints
- [ ] User account management endpoints
- [ ] Repair logs endpoints

### Priority 4 (Low - Reference Data):
- [ ] GET /brands
- [ ] GET /branches (detail)
- [ ] GET /departments (detail)

---

**Last Updated:** May 11, 2026  
**Frontend Version:** Angular 19.2  
**Backend URL:** https://ticketing-web-app.onrender.com
