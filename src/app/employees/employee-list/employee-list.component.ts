import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';
import { EmployeeDialogComponent } from '../employee-dialog/employee-dialog.component';
import { EmployeeViewDialogComponent } from '../employee-view-dialog/employee-view-dialog.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FormsModule,
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss'],
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  displayedColumns: string[] = [
    'employee_id',
    'name',
    'email',
    'contact_number',
    'position',
    'verification',
    'status',
    'actions',
  ];
  loading = true;
  searchText = '';
  statusFilter = 'all';

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to load employees',
        });
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    let filtered = this.employees;

    // Apply status filter
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(
        (emp) => emp.employment_status === true && emp.is_verified !== false,
      );
    } else if (this.statusFilter === 'pending') {
      filtered = filtered.filter(
        (emp) => emp.is_verified === false || emp.employment_status === false,
      );
    }

    this.filteredEmployees = filtered;
  }

  createEmployee(): void {
    const dialogRef = this.dialog.open(EmployeeDialogComponent, {
      width: '600px',
      data: {
        isEditMode: false,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadEmployees();
      }
    });
  }

  viewEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeViewDialogComponent, {
      width: '700px',
      data: {
        employeeId: employee.employee_id,
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      // Reload employees to reflect any status changes
      this.loadEmployees();
    });
  }

  editEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDialogComponent, {
      width: '600px',
      data: {
        employee: employee,
        isEditMode: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadEmployees();
      }
    });
  }

  deleteEmployee(employee: Employee): void {
    console.log('Delete button clicked for employee:', employee);
    console.log('Employee ID:', employee.employee_id);

    Swal.fire({
      title: 'Delete Employee',
      text: `Are you sure you want to delete "${this.getFullName(employee)}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      console.log('SweetAlert result:', result);
      if (result.isConfirmed && employee.employee_id) {
        console.log(
          'Calling deleteEmployee API with ID:',
          employee.employee_id,
        );
        this.employeeService
          .deleteEmployee(employee.employee_id as number)
          .subscribe({
            next: (response) => {
              console.log('Delete SUCCESS - Response:', response);
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Employee deleted successfully',
                timer: 2000,
                showConfirmButton: false,
              });
              this.loadEmployees();
            },
            error: (error) => {
              console.error('Delete FAILED - Full error:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: `Failed to delete employee: ${error.error?.message || error.message || 'Unknown error'}`,
              });
            },
          });
      }
    });
  }

  getFullName(employee: Employee): string {
    return `${employee.first_name} ${employee.last_name}`;
  }

  verifyEmployee(employee: Employee): void {
    if (!employee.employee_id) return;

    Swal.fire({
      title: 'Verify Employee',
      text: `Verify employee "${this.getFullName(employee)}"? They will be fully activated.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Verify',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && employee.employee_id) {
        this.employeeService
          .verifyEmployee(employee.employee_id as string)
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Verified!',
                text: 'Employee has been verified successfully',
                timer: 2000,
                showConfirmButton: false,
              });
              this.loadEmployees();
            },
            error: (error) => {
              console.error('Verify failed:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Failed to verify employee',
              });
            },
          });
      }
    });
  }
}
