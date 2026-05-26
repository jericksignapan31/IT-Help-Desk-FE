# Backend Requirements: Complete Ticket with Parts Workflow

## 🎯 Problem Statement

Currently, when an IT staff member selects "Need to Buy Parts" in the complete ticket form, the backend ignores this selection and marks the ticket as `resolved` anyway. The ticket should be marked as `waiting_for_parts` instead and stay open for parts tracking.

---

## 📋 Required Changes

### 1. **Ticket Status Enum Update**

Add new status to your ticket status list:

```python
# Add to your status enum/constants
WAITING_FOR_PARTS = 'waiting_for_parts'

# Full status flow should be:
# pending_approval → approved → assigned → in_progress → waiting_for_parts OR resolved → closed
```

### 2. **New Endpoint: GET /tickets/waiting-for-parts**

**Purpose:** Retrieve all tickets currently waiting for parts to arrive

**Method:** `GET`
**URL:** `/tickets/waiting-for-parts`
**Authentication:** Required (Bearer token)

**Response:**
```json
[
  {
    "ticket_id": 123,
    "subject": "Laptop keyboard not working",
    "status": "waiting_for_parts",
    "unit_status": "need_buy_parts",
    "parts": [
      {
        "part_id": "uuid",
        "part_name": "Keyboard",
        "quantity": 1,
        "unit_cost": 45.00,
        "total_cost": 45.00,
        "supplier": "TechSupply Inc",
        "status": "pending",
        "requested_date": "2026-05-26T10:30:00Z",
        "received_date": null
      }
    ],
    "assigned_to": 5,
    "created_at": "2026-05-20T08:00:00Z"
  }
]
```

---

### 3. **Critical: Update PATCH /tickets/{id}/complete Endpoint**

**Current Issue:** Backend is ignoring the `unit_status` value in the request

**Required Fix:**

```python
@app.patch('/tickets/<int:ticket_id>/complete')
def complete_ticket(ticket_id):
    """
    Complete a ticket with work details and determine final status based on unit_status
    
    Request Body:
    {
        "unit_status": "working" | "not_working" | "partially_working" | "need_buy_parts",
        "observation": "string (required)",
        "action_taken": "string (required)",
        "recommendation": "string (required)",
        "resolution_notes": "string (optional)"
    }
    """
    
    data = request.get_json()
    ticket = Ticket.query.get(ticket_id)
    
    if not ticket:
        return {"error": "Ticket not found"}, 404
    
    # Validate required fields
    required_fields = ['unit_status', 'observation', 'action_taken', 'recommendation']
    if not all(field in data for field in required_fields):
        return {"error": "Missing required fields"}, 400
    
    # ✅ IMPORTANT: Conditional status based on unit_status
    if data.get('unit_status') == 'need_buy_parts':
        # Put ticket on hold, waiting for parts to arrive
        ticket.status = 'waiting_for_parts'
        ticket.started_at = datetime.utcnow()  # Mark when work started (not completed)
    else:
        # Complete the ticket normally (working, not_working, partially_working)
        ticket.status = 'resolved'
        ticket.started_at = datetime.utcnow()
        ticket.resolved_at = datetime.utcnow()  # Mark completion time
    
    # Store work details
    ticket.unit_status = data.get('unit_status')
    ticket.observation = data.get('observation')
    ticket.action_taken = data.get('action_taken')
    ticket.recommendation = data.get('recommendation')
    ticket.resolution_notes = data.get('resolution_notes', '')
    
    # Save to database
    db.session.commit()
    
    return ticket.to_dict(), 200
```

---

### 4. **Database Schema Changes**

Make sure your Ticket table has these fields:

```sql
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS unit_status VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS observation TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS recommendation TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Add the new status value if using ENUM
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'waiting_for_parts';
```

Or in Python SQLAlchemy:

```python
class Ticket(db.Model):
    __tablename__ = 'tickets'
    
    ticket_id = db.Column(db.Integer, primary_key=True)
    # ... existing fields ...
    
    # NEW: Work completion fields
    unit_status = db.Column(db.String(50))  # working, not_working, partially_working, need_buy_parts
    observation = db.Column(db.Text)
    action_taken = db.Column(db.Text)
    recommendation = db.Column(db.Text)
    resolution_notes = db.Column(db.Text)
    
    # Status tracking
    status = db.Column(db.String(50), default='pending_approval')
    # Add 'waiting_for_parts' as valid status
```

---

### 5. **Parts Tracking Endpoint: GET /tickets/{id}/parts**

Make sure this endpoint exists and returns parts for a ticket:

```python
@app.get('/tickets/<int:ticket_id>/parts')
def get_ticket_parts(ticket_id):
    """Get all parts requested for a ticket"""
    
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return {"error": "Ticket not found"}, 404
    
    parts = TicketPart.query.filter_by(ticket_id=ticket_id).all()
    
    return [part.to_dict() for part in parts], 200
```

---

### 6. **Endpoint: PATCH /tickets/{id}/parts/{part_id}/status**

Allow updating part status (pending → ordered → received):

```python
@app.patch('/tickets/<int:ticket_id>/parts/<string:part_id>/status')
def update_part_status(ticket_id, part_id):
    """
    Update part status when parts arrive or are ordered
    
    Request Body:
    {
        "status": "pending" | "ordered" | "received",
        "notes": "string (optional)"
    }
    """
    
    data = request.get_json()
    part = TicketPart.query.filter_by(part_id=part_id, ticket_id=ticket_id).first()
    
    if not part:
        return {"error": "Part not found"}, 404
    
    part.status = data.get('status')
    
    # When part is received, set received_date
    if data.get('status') == 'received':
        part.received_date = datetime.utcnow()
    
    if data.get('notes'):
        part.notes = data.get('notes')
    
    db.session.commit()
    
    return part.to_dict(), 200
```

---

## 📊 Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    TICKET STATUS WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

                       SUPERVISOR APPROVAL
                              │
                              ▼
                    ┌─────────────────┐
                    │pending_approval │◄──────┐
                    └─────────────────┘       │
                              │               │
                    APPROVE ──►│◄─ REJECT ────┘
                              ▼
                          ┌────────┐
                          │approved│
                          └────────┘
                              │
              ASSIGN TO IT STAFF
                              ▼
                         ┌─────────┐
                         │assigned │
                         └─────────┘
                              │
              START WORKING (IT clicks "Start Work")
                              ▼
                       ┌──────────────┐
                       │in_progress   │
                       └──────────────┘
                              │
                 COMPLETE TICKET (IT clicks "Complete")
                              │
           ┌──────────────────┴──────────────────┐
           ▼                                      ▼
    ┌────────────────┐              ┌─────────────────────┐
    │ working        │              │ need_buy_parts      │
    │ not_working    │              │ (NEW STATUS!)       │
    │ partially_work │──────────►   └─────────────────────┘
    └────────────────┘                      │
           │                      REQUEST PARTS & TRACK
           │                                 │
           ▼                                 ▼
       ┌─────────┐              ┌──────────────────────┐
       │resolved │              │waiting_for_parts     │
       └─────────┘              │ (Parts ordered)      │
           │                    │ (Parts received)     │
           │                    └──────────────────────┘
           │                                 │
           │                                 ▼
           │                    ┌──────────────────────┐
           │                    │ resolved             │
           │                    │ (Parts received,     │
           │                    │  ready to resume)    │
           │                    └──────────────────────┘
           │                                 │
           └─────────────────┬───────────────┘
                             ▼
                        ┌─────────┐
                        │ closed  │
                        └─────────┘
```

---

## 🧪 Test Cases

### Test 1: Complete ticket as "Working"
```bash
PATCH /api/tickets/123/complete
Content-Type: application/json

{
  "unit_status": "working",
  "observation": "Hard drive was failing, replaced it",
  "action_taken": "Replaced 500GB SSD with new 1TB SSD",
  "recommendation": "Monitor hard drive health monthly"
}

# Expected Response:
# Status: 200
# ticket.status = "resolved"
# ticket.resolved_at = now
```

### Test 2: Complete ticket as "Need to Buy Parts"
```bash
PATCH /api/tickets/123/complete
Content-Type: application/json

{
  "unit_status": "need_buy_parts",
  "observation": "Keyboard is broken, needs replacement",
  "action_taken": "Identified keyboard malfunction, ordered replacement",
  "recommendation": "Install new keyboard once parts arrive"
}

# Expected Response:
# Status: 200
# ticket.status = "waiting_for_parts" ← KEY POINT
# ticket.resolved_at = null (NOT COMPLETED YET)
```

### Test 3: Get tickets waiting for parts
```bash
GET /api/tickets/waiting-for-parts

# Expected Response:
# Status: 200
# Returns array of tickets with status = "waiting_for_parts"
```

---

## 📝 Implementation Checklist

- [ ] Add `waiting_for_parts` to ticket status enum/constants
- [ ] Update Ticket model with new fields (unit_status, observation, action_taken, etc.)
- [ ] Update database migration to add new columns
- [ ] **FIX: Update PATCH /tickets/{id}/complete endpoint** (Most Important!)
  - [ ] Check `unit_status` value
  - [ ] Set status to `waiting_for_parts` if unit_status == "need_buy_parts"
  - [ ] Set status to `resolved` for other unit_status values
  - [ ] Store all work details in database
- [ ] Create GET /tickets/waiting-for-parts endpoint
- [ ] Verify GET /tickets/{id}/parts endpoint exists and works
- [ ] Create/verify PATCH /tickets/{id}/parts/{part_id}/status endpoint
- [ ] Test all 3 test cases above
- [ ] Deploy to production

---

## 🔗 Related Frontend Changes

The frontend is already ready with:
- ✅ "Need to Buy Parts" option in complete ticket form
- ✅ Parts tracking UI (request, view, update status)
- ✅ Waiting for Parts menu item in sidebar
- ✅ Parts tab in ticket detail dialog
- ✅ Status badges with proper colors

**Just waiting for backend to implement conditional status logic!** 🚀

---

## ❓ Questions?

If you need help with specific backend framework:
- **Python Flask**: Ask for Flask-specific implementation
- **Python Django**: Ask for Django models/views
- **Node.js/Express**: Ask for Express route handlers
- **FastAPI**: Ask for FastAPI async endpoints
- **Java/Spring**: Ask for Spring controller methods
- **C#/.NET**: Ask for .NET controller actions

