# 🔐 How to Get Current User in Components

## Quick Reference

### Method 1: Get User Immediately (Synchronous)

```typescript
import { AuthService } from "./services/auth.service";

export class MyComponent {
  constructor(private authService: AuthService) {
    // Get current user immediately
    const user = this.authService.getCurrentUser();
  }
}
```

### Method 2: Subscribe to User Changes (Observable)

```typescript
import { AuthService } from "./services/auth.service";

export class MyComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Subscribe to user changes
    this.authService.getCurrentUser$().subscribe((user) => {
      this.currentUser = user;
    });
  }
}
```

### Method 3: Get Formatted User Info

```typescript
import { AuthService } from "./services/auth.service";

export class MyComponent {
  constructor(private authService: AuthService) {
    const userInfo = this.authService.getUserInfo();
    // Returns: { id, username, email, role, employeeId, isActive }
  }
}
```

---

## 📚 All Available Methods

### 1. `getCurrentUser()` - Get Current User (Sync)

Returns the current user immediately. Use when you need instant access.

```typescript
const user = this.authService.getCurrentUser();
if (user) {
 
}
```

### 2. `getCurrentUser$()` - Get Current User (Observable)

Returns Observable that emits when user changes. Use for reactive updates.

```typescript
this.authService.getCurrentUser$().subscribe((user) => {
  if (user) {
  }
});
```

### 3. `currentUserValue` - Direct Access

Direct getter for current user value.

```typescript
const user = this.authService.currentUserValue;
```

### 4. `getUserInfo()` - Get Formatted User Info

Returns formatted user info with safe defaults.

```typescript
const info = this.authService.getUserInfo();
// { id: 1, username: 'admin', email: 'admin@...', role: 'ADMIN', ... }
```

### 5. `getUserRole()` - Get User Role

```typescript
const role = this.authService.getUserRole();
// Returns: 'admin' | 'technician' | 'user' | null
```

### 6. `getUserDisplayName()` - Get Display Name

```typescript
const name = this.authService.getUserDisplayName();
// Returns: username or 'Guest'
```

### 7. `isAuthenticated()` - Check if Logged In

```typescript
if (this.authService.isAuthenticated()) {
}
```

### 8. `isAdmin()` - Check if Admin

```typescript
if (this.authService.isAdmin()) {
}
```

### 9. `isTechnician()` - Check if Technician

```typescript
if (this.authService.isTechnician()) {
}
```

### 10. `hasRole([roles])` - Check Multiple Roles

```typescript
if (this.authService.hasRole([UserRole.ADMIN, UserRole.TECHNICIAN])) {
}
```

### 11. `hasSpecificRole(role)` - Check Specific Role

```typescript
if (this.authService.hasSpecificRole(UserRole.ADMIN)) {
}
```

### 12. `refreshUserProfile()` - Refresh from Server

```typescript
this.authService.refreshUserProfile().subscribe((user) => {
});
```

---

## 💡 Real-World Examples

### Example 1: Display User Info in Component

```typescript
import { Component, OnInit } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { User } from "../models/user.model";

@Component({
  selector: "app-profile",
  template: `
    <div *ngIf="user">
      <h2>Welcome, {{ user.username }}!</h2>
      <p>Email: {{ user.email }}</p>
      <p>Role: {{ user.role }}</p>
      <span [class]="getRoleBadge()">{{ user.role }}</span>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  user: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Get user on component init
    this.user = this.authService.getCurrentUser();
  }

  getRoleBadge(): string {
    if (this.authService.isAdmin()) return "badge-admin";
    if (this.authService.isTechnician()) return "badge-tech";
    return "badge-user";
  }
}
```

### Example 2: Show/Hide Based on Role

```typescript
@Component({
  selector: "app-admin-panel",
  template: `
    <div *ngIf="isAdmin">
      <h2>Admin Panel</h2>
      <!-- Admin only content -->
    </div>

    <div *ngIf="canManageTickets">
      <h2>Ticket Management</h2>
      <!-- Admin & Technician content -->
    </div>
  `,
})
export class AdminPanelComponent implements OnInit {
  isAdmin = false;
  canManageTickets = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.canManageTickets = this.authService.hasRole([UserRole.ADMIN, UserRole.TECHNICIAN]);
  }
}
```

### Example 3: Subscribe to User Changes

```typescript
@Component({
  selector: "app-header",
})
export class HeaderComponent implements OnInit, OnDestroy {
  username: string = "Guest";
  private subscription?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Subscribe to user changes
    this.subscription = this.authService.getCurrentUser$().subscribe((user) => {
      this.username = user?.username || "Guest";
    });
  }

  ngOnDestroy() {
    // Clean up subscription
    this.subscription?.unsubscribe();
  }
}
```

### Example 4: Check Before Action

```typescript
@Component({
  selector: "app-ticket-list",
})
export class TicketListComponent {
  constructor(private authService: AuthService) {}

  deleteTicket(ticketId: number) {
    // Check if user has permission
    if (!this.authService.isAdmin()) {
      alert("Only admins can delete tickets");
      return;
    }

    // Proceed with delete
    this.ticketService.delete(ticketId).subscribe();
  }

  assignTicket(ticketId: number) {
    // Check multiple roles
    if (!this.authService.hasRole([UserRole.ADMIN, UserRole.TECHNICIAN])) {
      alert("Only admin or technician can assign tickets");
      return;
    }

    // Proceed with assignment
    this.ticketService.assign(ticketId).subscribe();
  }
}
```

### Example 5: Get User in Service

```typescript
@Injectable({ providedIn: "root" })
export class TicketService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  createTicket(ticket: Ticket) {
    // Automatically add current user as creator
    const currentUser = this.authService.getCurrentUser();

    const ticketData = {
      ...ticket,
      created_by: currentUser?.id,
      created_by_name: currentUser?.username,
    };

    return this.http.post("/tickets", ticketData);
  }

  getMyTickets() {
    const userId = this.authService.getCurrentUser()?.id;
    return this.http.get(`/tickets/user/${userId}`);
  }
}
```

---

## 🎯 Best Practices

1. **Use `getCurrentUser()` for immediate access**

   ```typescript
   const user = this.authService.getCurrentUser();
   ```

2. **Use `getCurrentUser$()` for reactive updates**

   ```typescript
   this.authService.getCurrentUser$().subscribe(user => { ... });
   ```

3. **Always check for null**

   ```typescript
   const user = this.authService.getCurrentUser();
   if (user) {
   }
   ```

4. **Use role helper methods**

   ```typescript
   if (this.authService.isAdmin()) { ... }
   ```

5. **Unsubscribe from observables**
   ```typescript
   ngOnDestroy() {
     this.subscription?.unsubscribe();
   }
   ```

---

## ✅ Summary

| Method                 | Use Case             | Returns                                     |
| ---------------------- | -------------------- | ------------------------------------------- |
| `getCurrentUser()`     | Get user now         | `User \| null`                              |
| `getCurrentUser$()`    | Subscribe to changes | `Observable<User \| null>`                  |
| `getUserInfo()`        | Formatted display    | `{id, username, email, ...}`                |
| `getUserRole()`        | Get role             | `'admin' \| 'technician' \| 'user' \| null` |
| `getUserDisplayName()` | Display name         | `string`                                    |
| `isAuthenticated()`    | Check login          | `boolean`                                   |
| `isAdmin()`            | Check admin          | `boolean`                                   |
| `isTechnician()`       | Check tech           | `boolean`                                   |
| `hasRole([...])`       | Check multiple roles | `boolean`                                   |

---

**Need help?** Check the AuthService source code at `src/app/services/auth.service.ts`
