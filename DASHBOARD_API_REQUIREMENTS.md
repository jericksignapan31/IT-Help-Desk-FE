# 📊 Dashboard API Requirements

## Overview
This document outlines the API endpoint and response structure required to power the IT Help Desk Dashboard frontend component with accurate real-time data.

---

## API Endpoint

### Request
```
GET /dashboard/stats
```

**Authentication Required:** Yes (Bearer Token)  
**Authorization:** All authenticated users (applies role-based filtering if needed)  
**Content-Type:** `application/json`

### Response Status Codes
- `200 OK` - Successfully retrieved dashboard statistics
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error occurred

---

## Response Body Schema

### Complete Response Structure
```json
{
  "totalTickets": 45,
  "openTickets": 12,
  "pendingRepairs": 5,
  "assetsInUse": 89,
  "ticketsByStatus": {
    "open": 12,
    "in-progress": 8,
    "resolved": 20,
    "closed": 5
  },
  "ticketsByPriority": {
    "low": 10,
    "medium": 20,
    "high": 12,
    "urgent": 3
  },
  "assetsByCondition": {
    "excellent": 30,
    "good": 40,
    "fair": 15,
    "poor": 3,
    "broken": 1
  },
  "recentTickets": []
}
```

---

## Field Specifications

### Summary Statistics

| Field | Type | Required | Description | SQL Query |
|-------|------|----------|-------------|-----------|
| `totalTickets` | `number` | Yes | Total count of all tickets in system | `SELECT COUNT(*) FROM tickets` |
| `openTickets` | `number` | Yes | Count of all non-closed tickets | `SELECT COUNT(*) FROM tickets WHERE status != 'CLOSED'` |
| `pendingRepairs` | `number` | Yes | Count of assets currently in maintenance | `SELECT COUNT(*) FROM assets WHERE status = 'MAINTENANCE'` |
| `assetsInUse` | `number` | Yes | Count of assets actively in use | `SELECT COUNT(*) FROM assets WHERE status = 'IN_USE'` |

### Ticket Status Distribution

**Field Name:** `ticketsByStatus`  
**Type:** `Object<string, number>`

Count tickets grouped by their current status. Use the following exact keys (lowercase with hyphens):

```json
{
  "open": 0,              // Status: PENDING_APPROVAL
  "in-progress": 0,       // Status: IN_PROGRESS
  "resolved": 0,          // Status: RESOLVED
  "closed": 0             // Status: CLOSED
}
```

**SQL Query:**
```sql
SELECT 
  CASE 
    WHEN status = 'PENDING_APPROVAL' THEN 'open'
    WHEN status = 'IN_PROGRESS' THEN 'in-progress'
    WHEN status = 'RESOLVED' THEN 'resolved'
    WHEN status = 'CLOSED' THEN 'closed'
  END as status,
  COUNT(*) as count
FROM tickets
GROUP BY status
```

**Note:** Include ALL status keys even if count is 0 (for consistent chart rendering)

### Ticket Priority Distribution

**Field Name:** `ticketsByPriority`  
**Type:** `Object<string, number>`

Count tickets grouped by priority level. Use the following exact keys (lowercase):

```json
{
  "low": 0,
  "medium": 0,
  "high": 0,
  "urgent": 0
}
```

**SQL Query:**
```sql
SELECT 
  LOWER(priority) as priority,
  COUNT(*) as count
FROM tickets
GROUP BY priority
```

**Note:** Include ALL priority keys even if count is 0 (for consistent chart rendering)

### Asset Condition Distribution

**Field Name:** `assetsByCondition`  
**Type:** `Object<string, number>`

Count assets grouped by their condition. Use the following exact keys (lowercase):

```json
{
  "excellent": 0,
  "good": 0,
  "fair": 0,
  "poor": 0,
  "broken": 0
}
```

**SQL Query:**
```sql
SELECT 
  LOWER(condition) as condition,
  COUNT(*) as count
FROM assets
GROUP BY condition
```

**Note:** Include ALL condition keys even if count is 0 (for consistent chart rendering)

### Recent Tickets

**Field Name:** `recentTickets`  
**Type:** `Array<Object>`  
**Status:** Currently Unused (Future Enhancement)

Currently, the frontend doesn't display this data, but the field must be included in the response.

```json
{
  "recentTickets": []
}
```

For future implementation, this could contain recent tickets with basic details.

---

## Data Type Definitions

All numeric values must be non-negative integers (≥ 0).

```typescript
interface DashboardStats {
  totalTickets: number;           // >= 0
  openTickets: number;            // >= 0
  pendingRepairs: number;         // >= 0
  assetsInUse: number;            // >= 0
  ticketsByStatus: {
    open: number;                 // >= 0
    "in-progress": number;        // >= 0
    resolved: number;             // >= 0
    closed: number;               // >= 0
  };
  ticketsByPriority: {
    low: number;                  // >= 0
    medium: number;               // >= 0
    high: number;                 // >= 0
    urgent: number;               // >= 0
  };
  assetsByCondition: {
    excellent: number;            // >= 0
    good: number;                 // >= 0
    fair: number;                 // >= 0
    poor: number;                 // >= 0
    broken: number;               // >= 0
  };
  recentTickets: any[];           // Empty array for now
}
```

---

## Example cURL Request

```bash
curl -X GET https://ticketing-web-app.onrender.com/dashboard/stats \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json"
```

---

## Example Response

```json
HTTP/1.1 200 OK
Content-Type: application/json

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

---

## Implementation Checklist

### Database Queries
- [ ] Create query to count total tickets
- [ ] Create query to count open tickets (status != CLOSED)
- [ ] Create query to count assets in maintenance
- [ ] Create query to count assets in use
- [ ] Create query to count tickets by status with all status keys
- [ ] Create query to count tickets by priority with all priority keys
- [ ] Create query to count assets by condition with all condition keys

### API Endpoint
- [ ] Create GET `/dashboard/stats` endpoint
- [ ] Add authentication middleware (JWT Bearer token required)
- [ ] Implement all database queries
- [ ] Format response according to schema above
- [ ] Add error handling for database errors
- [ ] Return 200 status with JSON response on success
- [ ] Return 401 on authentication failure
- [ ] Return 500 on server errors

### Testing
- [ ] Test endpoint with valid authentication token
- [ ] Verify all fields are present in response
- [ ] Verify numeric values are accurate
- [ ] Verify all status/priority/condition keys exist (even if 0)
- [ ] Test with various data scenarios (empty, partial, full)
- [ ] Test CORS headers if needed (frontend is on different domain)

---

## Notes

### Important Requirements
1. **All keys must use lowercase with hyphens** (e.g., `"in-progress"`, not `"IN_PROGRESS"`)
2. **All status/priority/condition keys MUST be included** even if the count is 0
3. **All numeric values must be non-negative integers**
4. **Response must be valid JSON** with proper content type

### Frontend Integration
- Frontend URL: `https://it-help-desk-fe.vercel.app`
- Backend URL: `https://ticketing-web-app.onrender.com`
- **Important:** Ensure CORS headers allow requests from frontend origin
- Dashboard calls this endpoint on page load and displays real-time statistics

### CORS Configuration Required
The API must return these headers in response:
```
Access-Control-Allow-Origin: https://it-help-desk-fe.vercel.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET
```

### Error Handling
If there's an error retrieving statistics, the frontend will:
1. Log the error to console
2. Fall back to mock data (for development/testing purposes)
3. Display the dashboard with placeholder values

It's recommended to implement proper error responses:
```json
{
  "error": "Error message describing what went wrong",
  "statusCode": 500
}
```

---

## Support & Questions

For questions about this API specification, please refer to the frontend repository:
- **Frontend Repository:** IT Help Desk Frontend
- **Dashboard Component:** `src/app/dashboard/dashboard.component.ts`
- **Dashboard Service:** `src/app/services/dashboard.service.ts`
- **Data Model:** `src/app/models/dashboard.model.ts`

---

**Last Updated:** May 11, 2026  
**Version:** 1.0  
**Status:** Active Development
