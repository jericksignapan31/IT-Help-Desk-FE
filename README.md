# IT Help Desk System - Frontend

A comprehensive Angular-based IT Help Desk Management System for managing IT assets, tracking support tickets, monitoring repairs, and handling employee requests across multiple branches.

## 🚀 Features

### Core Modules

1. **Authentication & Authorization**
   - JWT token-based authentication
   - Role-based access control (Admin, Technician, User)
   - Protected routes with guards

2. **Dashboard**
   - Overview statistics (tickets, repairs, assets)
   - Interactive charts (tickets by status/priority)
   - Quick action buttons

3. **Ticket Management** (Main Feature)
   - Create and manage support tickets
   - Filter by status, priority, category
   - "My Tickets" view for users
   - "Assigned to Me" view for technicians
   - "All Tickets" view for admins

4. **Asset Management**
   - Track IT assets (computers, laptops, printers, etc.)
   - Asset assignment to employees
   - Status and condition monitoring
   - Advanced filters

5. **Employee Management** (Admin Only)
   - CRUD operations for employees
   - Link employees to departments and branches

6. **Branch & Department Management** (Admin Only)
   - Manage company branches and departments

7. **Repair Log Management** (Technician/Admin)
   - Log and track repairs
   - Cost tracking

8. **User Account Management** (Admin Only)
   - Create and manage user accounts
   - Role assignment

## 🛠️ Tech Stack

- **Framework:** Angular 19.2.0
- **UI Library:** Angular Material 19.0.0
- **Styling:** SCSS
- **Charts:** Chart.js
- **Notifications:** ngx-toastr
- **HTTP:** Angular HttpClient with JWT interceptors

## 🔧 Installation

```bash
npm install
```

## 🚀 Running the Application

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── app/
│   ├── models/              # Data models and interfaces
│   ├── services/            # API services
│   ├── guards/              # Route guards
│   ├── interceptors/        # HTTP interceptors
│   ├── layout/              # Main layout component
│   ├── dashboard/           # Dashboard module
│   ├── tickets/             # Ticket management
│   ├── assets/              # Asset management
│   ├── employees/           # Employee management
│   ├── branches/            # Branch management
│   └── app.routes.ts        # Application routes
└── auth/                    # Authentication module
    └── login/
```

## 🔐 User Roles & Permissions

### Admin

- Full access to all modules
- Manage employees, branches, departments
- View all tickets and assets

### Technician

- View assigned tickets
- Update ticket status
- Create repair logs
- Manage assets

### User

- Create support tickets
- View own tickets
- View asset inventory

## 🔄 API Integration

Backend API should be running at `http://localhost:3005`

### Key Endpoints

- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile
- `GET/POST/PATCH/DELETE /tickets` - Ticket management
- `GET/POST/PATCH/DELETE /assets` - Asset management
- `GET/POST/PATCH/DELETE /employees` - Employee management
- `GET/POST/PATCH/DELETE /branches` - Branch management
- `GET/POST/PATCH/DELETE /departments` - Department management
- `GET/POST/PATCH/DELETE /repair-logs` - Repair log management
- `GET /dashboard/stats` - Dashboard statistics

## 🎨 Key Features

- Responsive, mobile-friendly design
- Real-time search and filtering
- Form validation
- Loading states and error handling
- Toast notifications
- Confirmation dialogs
- Color-coded status indicators
- Icon-based action buttons

## 🐛 Troubleshooting

### CORS Issues

Ensure your backend allows requests from `http://localhost:4200`

### Module Not Found

Run `npm install` to install missing dependencies

## 📦 Main Dependencies

- @angular/core: ^19.2.0
- @angular/material: ^19.0.0
- @angular/cdk: ^19.0.0
- chart.js: latest
- ngx-toastr: ^19.0.0

## 🔮 Future Enhancements

- Dark mode support
- Export to Excel/PDF
- Real-time notifications
- Asset QR code generation
- Advanced reporting
- Email notifications
- File attachments
- Multi-language support

---

**Built with ❤️ using Angular 19**
# Webhook test
