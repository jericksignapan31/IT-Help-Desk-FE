# IT Help Desk System - Project Description

## 📋 Project Overview

**IT Help Desk Frontend** is a modern, enterprise-grade Angular-based web application designed to streamline IT support operations across distributed organizations. It serves as the client-side interface for an integrated IT ticketing, asset management, and operational analytics platform.

### Purpose
The system enables organizations to:
- Efficiently manage IT support requests through a centralized ticketing system
- Track and manage IT assets across multiple departments and branches
- Monitor operational metrics through advanced analytics dashboards
- Control user access through role-based permissions
- Maintain comprehensive records of repairs and maintenance activities

---

## 🎯 Core Business Capabilities

### 1. **Ticket Management System**
The primary module for IT support operations:
- **Support Request Creation**: Users can submit detailed support tickets with category, priority, and description
- **Ticket Lifecycle Management**: Track tickets through statuses (Open, In Progress, Resolved, Closed)
- **Multi-View Dashboard**: 
  - My Tickets (user's own requests)
  - Assigned to Me (technician assignments)
  - All Tickets (admin overview)
  - Pending Approvals (workflow management)
- **Advanced Filtering**: Filter by status, priority, category, assignee, and date range
- **Real-time Status Updates**: Instant notifications when ticket status changes

### 2. **Asset Management**
Complete IT inventory tracking system:
- **Asset Catalog**: Computer hardware, laptops, printers, peripherals, and IT equipment
- **Asset Lifecycle**: Track asset condition, status, and location
- **Assignment Tracking**: Link assets to specific employees and departments
- **Status Monitoring**: Monitor asset health and maintenance schedules
- **Detail View Dialogs**: Quick access to comprehensive asset information

### 3. **Repair & Maintenance Tracking**
Log and manage equipment repairs:
- **Repair History**: Detailed records of all maintenance activities
- **Cost Tracking**: Monitor repair expenses and budget allocation
- **Technician Assignment**: Link repairs to responsible technicians
- **Status Timeline**: Track repair progress from submission to completion

### 4. **Operational Analytics Dashboard**
Data-driven insights for management:
- **Ticket Metrics Dashboard**:
  - Total tickets by department with monthly breakdown
  - Status distribution (Open, In Progress, Resolved, Closed)
  - Interactive bar charts and doughnut charts
  - Department-level performance metrics
  - Month/year filtering for trend analysis

- **Tactical/Requisition Dashboard**:
  - Requisition volume by department
  - Approval status tracking (Approved vs Pending)
  - Cost analysis and budgeting
  - Currency-formatted financial reports (PHP)
  - Average cost calculations per department

- **Overview Dashboard**:
  - Key performance indicators (KPIs)
  - Quick stats (total tickets, open tickets, repairs)
  - Priority distribution visualization
  - Quick action buttons for common tasks

### 5. **User & Account Management** (Admin Only)
Administrative controls for system users:
- **Role-Based User Creation**: Create users with specific roles
  - 👤 **Administrator**: Full system access, user management, configuration
  - 🔑 **Supervisor**: Ticket approval, report management, team oversight
  - 🛠️ **IT Technician**: Ticket resolution, repair logging, asset management
  - 👥 **Employee**: Self-service ticket creation, limited permissions
  - 📦 **Warehouse Staff**: Inventory and asset tracking

- **Account Management**:
  - Create new user accounts with password setup
  - Edit existing user profiles and roles
  - Toggle account activation/deactivation
  - Delete user accounts with confirmation
  - Manage account verification status

- **Account Verification Workflow**:
  - New accounts marked as pending verification
  - Approve/reject unverified accounts
  - Role-specific default permissions

### 6. **Organizational Structure Management** (Admin Only)
- **Branch Management**: Multiple branch locations for distributed organizations
- **Department Management**: Organize employees and tickets by department
- **Employee Management**: Maintain employee directory with department assignments
- **Hierarchy Tracking**: Link employees to branches and departments

---

## 🛠️ Technology Stack

### Frontend Framework
- **Angular 17+** (Latest standalone components, no NgModule dependencies)
- **TypeScript 5.x** (Strict type checking, enhanced IDE support)
- **SCSS** (Advanced styling with variables, mixins, nesting)

### UI & Design
- **Angular Material 19.0.0**:
  - Material Design components (cards, buttons, dialogs, tables)
  - Responsive grid layout system
  - Built-in theming and color system
  - Accessibility features

### Data Visualization
- **Chart.js** with registerables for multiple chart types:
  - Bar charts for metrics comparison
  - Doughnut charts for distribution analysis
  - Line charts for trend tracking
  - Real-time data filtering

### HTTP & API
- **Angular HttpClient**: RESTful API communication
- **JWT Interceptor**: Automatic Bearer token injection
- **Environment Configuration**: API URL management (dev/prod)

### Notifications & UX
- **SweetAlert2**: User-friendly modal dialogs and notifications
- **Angular Material Snackbar**: Toast notifications
- **Loading Spinners**: Visual feedback during async operations

### Build & Development
- **esbuild**: Fast ES module bundling
- **Angular CLI**: Project scaffolding and build automation
- **Hot Module Replacement (HMR)**: Instant browser updates during development
- **ng serve**: Development server with live reload

---

## 🏗️ System Architecture

### Component Structure
```
├── Authentication Layer
│   ├── Login/Signup Components
│   └── JWT Token Management

├── Core Layout
│   ├── Navigation Sidebar
│   ├── Top Navigation Bar
│   └── Role-Based Menu Items

├── Feature Modules
│   ├── Dashboard (Operational, Tactical, Overview)
│   ├── Tickets (List, Form, Status Management)
│   ├── Assets (List, Detail, Assignment)
│   ├── Repairs (History, Logging)
│   ├── Employees (Management, Directory)
│   ├── Departments (Configuration)
│   ├── Branches (Multi-location Support)
│   └── User Accounts (Admin Management)

└── Shared Services
    ├── API Service Layer
    ├── Authentication Service
    ├── Route Guards
    └── HTTP Interceptors
```

### Data Flow
```
User Action
    ↓
Component / Form
    ↓
Service (API Call)
    ↓
HttpClient + JWT Interceptor
    ↓
Backend API
    ↓
Database
    ↓
Response → Service → Component → UI Update
```

### Security Implementation
- **JWT Authentication**: Secure token-based access
- **Role-Based Access Control (RBAC)**: 5-tier permission system
- **Route Guards**: Protect pages based on user role
- **HTTP Interceptor**: Automatic token injection and refresh
- **Token Validation**: Backend verification of all requests

---

## 📊 Data Models

### Key Entities

**User Account**
```typescript
{
  id: string
  username: string (unique)
  email: string (unique)
  role: 'admin' | 'supervisor' | 'it' | 'employee' | 'warehouse'
  is_active: boolean
  is_verified: boolean
  created_at: Date
  updated_at: Date
}
```

**Ticket**
```typescript
{
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  assigned_to: User
  created_by: User
  department_id: string
  created_at: Date
  updated_at: Date
}
```

**Asset**
```typescript
{
  id: string
  asset_code: string (unique)
  asset_name: string
  category: string
  status: 'available' | 'assigned' | 'maintenance' | 'disposed'
  assigned_to: Employee
  condition: 'good' | 'fair' | 'poor'
  purchase_date: Date
  created_at: Date
}
```

**Department Metrics** (Dashboard)
```typescript
{
  department_id: string
  department_name: string
  ticket_count: number
  open_count: number
  in_progress_count: number
  resolved_count: number
  closed_count: number
  requisition_count: number
  total_costing: number (PHP)
  average_costing: number (PHP)
}
```

---

## 🚀 Key Features & Functionality

### User Experience Features
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- ✅ **Real-time Filtering**: Instant results as you type
- ✅ **Data Tables with Sorting**: Multi-column sortable tables with pagination
- ✅ **Modal Dialogs**: Confirmation dialogs, detail views, forms
- ✅ **Color-Coded Status Indicators**: Quick visual identification
- ✅ **Loading States**: Spinners and progress indicators
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Success Notifications**: Confirmations for completed actions
- ✅ **Icon-Based UI**: Material Icons for intuitive navigation

### Administrative Features
- ✅ **Bulk User Management**: Create, edit, delete, activate/deactivate accounts
- ✅ **Account Verification Workflow**: Approve/reject new user signups
- ✅ **Role Configuration**: Assign specific roles with predefined permissions
- ✅ **Audit Trail**: Track created_at, updated_at timestamps
- ✅ **Quick Stats**: Dashboard KPIs for system health monitoring

### Analytics & Reporting
- ✅ **Department-Level Analysis**: Metrics segmented by department
- ✅ **Trend Analysis**: Month/year filtering for historical data
- ✅ **Financial Reporting**: Cost tracking and budget analysis
- ✅ **Status Distribution**: Visualization of ticket/approval workflow
- ✅ **Interactive Charts**: Drill-down capability with filtered data

---

## 🔌 API Integration

### Backend Connection
- **Base URL**: `https://ticketing-web-app.onrender.com` (Production)
- **Protocol**: RESTful HTTP/HTTPS
- **Authentication**: Bearer Token (JWT)

### Key API Endpoints
```
Authentication:
POST   /auth/login
GET    /auth/profile
POST   /auth/refresh

Tickets:
GET    /tickets (list all)
POST   /tickets (create)
GET    /tickets/:id (detail)
PATCH  /tickets/:id (update)
DELETE /tickets/:id (delete)

Assets:
GET    /assets
POST   /assets
PATCH  /assets/:id
DELETE /assets/:id

Employees:
GET    /employees
POST   /employees
PATCH  /employees/:id
DELETE /employees/:id

Dashboards:
GET    /dashboard/operational?month=6&year=2026
GET    /dashboard/tactical?month=6&year=2026
GET    /dashboard/stats

User Accounts:
GET    /user-accounts
POST   /user-accounts
PATCH  /user-accounts/:id
DELETE /user-accounts/:id
```

---

## 📈 Current Status & Features

### Implemented ✅
- Complete authentication and authorization system
- Full ticket management lifecycle
- Asset inventory tracking and assignment
- Repair log management
- Operational Analytics Dashboard (real-time department metrics)
- Tactical Analytics Dashboard (requisition & financial data)
- Overview Dashboard (KPIs and quick stats)
- User Account Management with 5 role types
- Employee and Department management
- Branch management for multi-location support
- Comprehensive Material Design UI
- JWT-based API integration

### Tested & Validated ✅
- Dashboard components with real backend data
- API integration with production environment
- Form validation and submission
- Role-based access control
- Responsive design (desktop, tablet, mobile)

### Performance Optimizations ✅
- esbuild for fast bundling
- Tree-shaking of unused code
- Material components lazy-loaded
- Chart filtering to exclude zero values
- Async data loading with loading states

---

## 🎓 Use Cases

### For End Users
1. **Submit Support Ticket**: Create support requests with category and priority
2. **Track Ticket Status**: Monitor resolution progress in real-time
3. **View Asset Information**: Check assigned equipment and specifications
4. **Access Personal Profile**: Update account information

### For IT Technicians
1. **View Assigned Tickets**: See all tickets assigned to them
2. **Update Ticket Status**: Mark tickets as in-progress or resolved
3. **Log Repairs**: Record maintenance activities and costs
4. **Manage Assets**: Track equipment assignments and conditions

### For Supervisors
1. **Review Pending Approvals**: Approve or reject pending requests
2. **Monitor Team Performance**: View department-level metrics
3. **Generate Reports**: Export analytics for management review
4. **Manage Department**: Oversee employees and resources

### For Administrators
1. **System Configuration**: Manage users, roles, departments, branches
2. **Create User Accounts**: Set up accounts with role assignment
3. **Monitor System Health**: View operational and tactical dashboards
4. **Manage Workflow**: Configure approval processes and escalations

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based login
- **Role-Based Access Control**: 5-level permission hierarchy
- **Route Guards**: Prevent unauthorized access to protected pages
- **Encrypted Passwords**: Securely transmitted via HTTPS
- **Auto-Logout**: Sessions expire after inactivity
- **CSRF Protection**: Angular's built-in XSRF handling
- **Input Validation**: Client-side form validation + server-side checks

---

## 📱 Responsive Breakpoints

- **Mobile**: 480px - 767px (Single column layout)
- **Tablet**: 768px - 1023px (Two column adaptive)
- **Desktop**: 1024px+ (Full responsive grid)

---

## 🎨 Design System

- **Color Scheme**: Material Design colors
  - Primary: #1976d2 (Blue)
  - Accent: #ff4081 (Pink)
  - Warn: #ff5252 (Red)
  - Success: #4caf50 (Green)

- **Typography**: Material Design font scale
- **Spacing**: 8px base unit system
- **Icons**: Google Material Icons

---

## 📦 Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## 🤝 Contributing

- Follow Angular style guide for code organization
- Use TypeScript strict mode for type safety
- Implement unit tests for new features
- Document component APIs and service methods
- Ensure responsive design across all breakpoints

---

## 📞 Support & Documentation

- **Documentation**: Check inline code comments
- **Error Handling**: Review browser console for debugging
- **Backend API**: Refer to backend documentation
- **Material Design**: https://material.angular.io/
- **Angular Guide**: https://angular.io/docs

---

**Last Updated**: June 8, 2026
**Version**: 1.0.0
**Status**: Production Ready
