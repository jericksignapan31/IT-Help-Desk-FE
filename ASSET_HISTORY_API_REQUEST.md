# Asset History API Request - Backend Implementation Guide

## 📋 Overview
The frontend Asset Scanner component needs an endpoint to retrieve the complete history/timeline of changes for each asset (status changes, assignments, repairs, movements).

---

## 🔌 Endpoint Specification

### GET /assets/{assetId}/history

**Purpose:** Retrieve all events/changes related to a specific asset

**URL Parameters:**
- `assetId` (required): ID of the asset

**Query Parameters (optional):**
- `limit` (default: 50): Number of records to return
- `offset` (default: 0): Pagination offset
- `type` (optional): Filter by event type (status_change, assignment, repair, movement)

**Example Request:**
```
GET /assets/1/history
GET /assets/1/history?limit=20&offset=0&type=repair
```

---

## 📤 Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "assetId": 1,
    "assetTag": "AST-001",
    "totalEvents": 15,
    "events": [
      {
        "id": 1,
        "type": "status_change",
        "description": "Status changed from AVAILABLE to IN_USE",
        "previousValue": "AVAILABLE",
        "newValue": "IN_USE",
        "changedBy": "John Admin",
        "changedByRole": "ADMIN",
        "timestamp": "2026-05-10T14:30:00Z",
        "details": {
          "reason": "Assigned to employee"
        }
      },
      {
        "id": 2,
        "type": "assignment",
        "description": "Assigned to Jane Smith (Employee ID: 42)",
        "employeeId": 42,
        "employeeName": "Jane Smith",
        "previousEmployee": "John Doe",
        "changedBy": "Admin User",
        "changedByRole": "ADMIN",
        "timestamp": "2026-05-10T14:25:00Z",
        "details": {
          "fromBranch": "HQ",
          "toBranch": "HQ",
          "notes": "Equipment replacement"
        }
      },
      {
        "id": 3,
        "type": "repair",
        "description": "Replaced GPU - NVIDIA RTX 4060",
        "repairType": "Hardware Replacement",
        "technician": "IT Tech - Mike",
        "technicianId": 5,
        "changedBy": "Mike Tech",
        "changedByRole": "IT",
        "timestamp": "2026-05-09T10:15:00Z",
        "details": {
          "ticketId": 156,
          "parts": [
            {
              "partName": "NVIDIA RTX 4060",
              "partCode": "PART-001",
              "cost": 350.00,
              "vendor": "Tech Parts Inc"
            }
          ],
          "cost": 350.00,
          "notes": "GPU failure - replaced with new unit",
          "duration": "2 hours"
        }
      },
      {
        "id": 4,
        "type": "movement",
        "description": "Moved from Branch 'Main Office' to 'Branch 2'",
        "fromBranch": "Main Office",
        "toBranch": "Branch 2",
        "fromBranchId": 1,
        "toBranchId": 2,
        "movedBy": "Admin User",
        "changedByRole": "ADMIN",
        "timestamp": "2026-05-08T09:00:00Z",
        "details": {
          "reason": "Employee transfer",
          "notes": "Transferred with employee"
        }
      },
      {
        "id": 5,
        "type": "status_change",
        "description": "Status changed from IN_USE to IN_REPAIR",
        "previousValue": "IN_USE",
        "newValue": "IN_REPAIR",
        "changedBy": "IT Tech - Mike",
        "changedByRole": "IT",
        "timestamp": "2026-05-07T15:45:00Z",
        "details": {
          "ticketId": 156,
          "reason": "GPU failure detected",
          "estimatedRepairTime": "2-3 days"
        }
      }
    ]
  },
  "message": "Asset history retrieved successfully"
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "error": "Asset not found",
  "assetId": 999
}
```

### Error Response (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Failed to retrieve asset history",
  "details": "Database connection error"
}
```

---

## 🗄️ Required Database Tables

### 1. **asset_status_history** (for status changes)
```sql
CREATE TABLE asset_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  reason VARCHAR(255),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
  FOREIGN KEY (changed_by) REFERENCES users(id),
  INDEX (asset_id, timestamp DESC)
);
```

### 2. **asset_assignment_history** (for assignments)
```sql
CREATE TABLE asset_assignment_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  previous_employee_id INT,
  new_employee_id INT,
  assigned_by INT NOT NULL,
  notes VARCHAR(255),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
  FOREIGN KEY (previous_employee_id) REFERENCES employees(id),
  FOREIGN KEY (new_employee_id) REFERENCES employees(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  INDEX (asset_id, timestamp DESC)
);
```

### 3. **repair_logs** (for repairs - may already exist)
```sql
CREATE TABLE repair_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  ticket_id INT,
  technician_id INT NOT NULL,
  repair_type VARCHAR(100),
  description TEXT,
  parts_replaced TEXT, -- JSON array of parts used
  cost DECIMAL(10, 2),
  duration_hours INT,
  started_date DATETIME,
  completed_date DATETIME,
  notes TEXT,
  created_by INT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
  FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id),
  FOREIGN KEY (technician_id) REFERENCES employees(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX (asset_id, timestamp DESC)
);
```

### 4. **asset_movement_history** (for branch/location changes)
```sql
CREATE TABLE asset_movement_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  from_branch_id INT,
  to_branch_id INT NOT NULL,
  moved_by INT NOT NULL,
  reason VARCHAR(255),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
  FOREIGN KEY (from_branch_id) REFERENCES branches(id),
  FOREIGN KEY (to_branch_id) REFERENCES branches(id),
  FOREIGN KEY (moved_by) REFERENCES users(id),
  INDEX (asset_id, timestamp DESC)
);
```

---

## 🔧 SQL Query (Node.js/Express Implementation)

```javascript
// GET /assets/:assetId/history
app.get('/assets/:assetId/history', async (req, res) => {
  try {
    const { assetId } = req.params;
    const { limit = 50, offset = 0, type } = req.query;

    // Verify asset exists
    const assetCheck = await db.query('SELECT * FROM assets WHERE asset_id = ?', [assetId]);
    if (assetCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found',
        assetId: assetId
      });
    }

    const asset = assetCheck[0];

    // Get all events from different tables
    let allEvents = [];

    // 1. Status Changes
    const statusChanges = await db.query(`
      SELECT 
        id,
        'status_change' as type,
        CONCAT('Status changed from ', previous_status, ' to ', new_status) as description,
        previous_status as previousValue,
        new_status as newValue,
        u.username as changedBy,
        u.role as changedByRole,
        timestamp,
        reason,
        NULL as details
      FROM asset_status_history ash
      JOIN users u ON ash.changed_by = u.id
      WHERE ash.asset_id = ?
      ORDER BY timestamp DESC
    `, [assetId]);

    // 2. Assignments
    const assignments = await db.query(`
      SELECT 
        id,
        'assignment' as type,
        CONCAT('Assigned to ', e.first_name, ' ', e.last_name, ' (Employee ID: ', e.id, ')') as description,
        e.id as employeeId,
        CONCAT(e.first_name, ' ', e.last_name) as employeeName,
        NULL as previousValue,
        NULL as newValue,
        u.username as changedBy,
        u.role as changedByRole,
        timestamp,
        notes,
        NULL as details
      FROM asset_assignment_history aah
      JOIN users u ON aah.assigned_by = u.id
      LEFT JOIN employees e ON aah.new_employee_id = e.id
      WHERE aah.asset_id = ?
      ORDER BY timestamp DESC
    `, [assetId]);

    // 3. Repairs
    const repairs = await db.query(`
      SELECT 
        id,
        'repair' as type,
        description,
        NULL as previousValue,
        NULL as newValue,
        u.username as changedBy,
        u.role as changedByRole,
        timestamp,
        repair_type,
        technician_id,
        ticket_id,
        parts_replaced,
        cost,
        duration_hours,
        notes
      FROM repair_logs rl
      JOIN users u ON rl.created_by = u.id
      WHERE rl.asset_id = ?
      ORDER BY timestamp DESC
    `, [assetId]);

    // 4. Movements
    const movements = await db.query(`
      SELECT 
        id,
        'movement' as type,
        CONCAT('Moved from Branch ', b1.name, ' to ', b2.name) as description,
        b1.name as fromBranch,
        b2.name as toBranch,
        b1.id as fromBranchId,
        b2.id as toBranchId,
        NULL as previousValue,
        NULL as newValue,
        u.username as changedBy,
        u.role as changedByRole,
        timestamp,
        reason
      FROM asset_movement_history amh
      JOIN users u ON amh.moved_by = u.id
      LEFT JOIN branches b1 ON amh.from_branch_id = b1.id
      LEFT JOIN branches b2 ON amh.to_branch_id = b2.id
      WHERE amh.asset_id = ?
      ORDER BY timestamp DESC
    `, [assetId]);

    // Combine and sort all events by timestamp
    allEvents = [
      ...statusChanges.map(e => ({ ...e, eventType: 'status_change' })),
      ...assignments.map(e => ({ ...e, eventType: 'assignment' })),
      ...repairs.map(e => ({ ...e, eventType: 'repair' })),
      ...movements.map(e => ({ ...e, eventType: 'movement' }))
    ];

    // Apply type filter if provided
    if (type) {
      allEvents = allEvents.filter(e => e.type === type);
    }

    // Sort by timestamp descending (most recent first)
    allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const totalEvents = allEvents.length;
    const paginatedEvents = allEvents.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        assetId: asset.asset_id,
        assetTag: asset.asset_tag,
        totalEvents: totalEvents,
        events: paginatedEvents
      },
      message: 'Asset history retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching asset history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve asset history',
      details: error.message
    });
  }
});
```

---

## 📋 Implementation Checklist

- [ ] Create `asset_status_history` table
- [ ] Create `asset_assignment_history` table  
- [ ] Create `repair_logs` table (or update if exists)
- [ ] Create `asset_movement_history` table
- [ ] Create indexes on all `asset_id` columns
- [ ] Implement GET `/assets/{assetId}/history` endpoint
- [ ] Add pagination support (limit, offset)
- [ ] Add optional type filter parameter
- [ ] Test with sample data
- [ ] Add error handling (asset not found, DB errors)
- [ ] Add user authentication check
- [ ] Add timestamp formatting (ISO 8601)
- [ ] Test with all 4 event types

---

## 🧪 Testing Examples

### Get all asset history
```bash
curl https://ticketing-web-app.onrender.com/assets/1/history
```

### Get only repairs
```bash
curl https://ticketing-web-app.onrender.com/assets/1/history?type=repair
```

### Get 10 records, skip first 5
```bash
curl https://ticketing-web-app.onrender.com/assets/1/history?limit=10&offset=5
```

---

## 🎯 Frontend Integration

Once this endpoint is ready, update `loadAssetHistory()` in the scanner component:

```typescript
loadAssetHistory(assetId: number | string): void {
  this.assetService.getAssetHistory(assetId).subscribe({
    next: (response: any) => {
      this.assetHistory = response.data.events;
      this.loadingAsset = false;
    },
    error: (error) => {
      console.error('Failed to load asset history:', error);
      this.assetHistory = [];
      this.loadingAsset = false;
    }
  });
}
```

Add method to `asset.service.ts`:
```typescript
getAssetHistory(assetId: number | string): Observable<any> {
  return this.http.get(`${API_URL}/assets/${assetId}/history`);
}
```

---

## 📞 Questions?
If backend team has questions about data structure or requirements, ask! This document can be updated.
