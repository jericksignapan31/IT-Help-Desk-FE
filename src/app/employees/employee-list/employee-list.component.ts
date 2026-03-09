import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';
import { EmployeeDialogComponent } from '../employee-dialog/employee-dialog.component';
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
  displayedColumns: string[] = [
    'employee_id',
    'name',
    'email',
    'contact_number',
    'position',
    'status',
    'actions',
  ];
  loading = true;
  searchText = '';

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

  toggleStatus(employee: Employee): void {
    if (!employee.employee_id) {
      console.log('No employee employee_id found:', employee);
      return;
    }

    console.log('Toggle status for employee:', employee);
    console.log('Current employment_status:', employee.employment_status);

    const oldStatus = employee.employment_status;
    const newStatus = !employee.employment_status;

    // Optimistic UI update - change status immediately
    employee.employment_status = newStatus;
    console.log('Updated UI to new employment_status:', newStatus);

    this.employeeService
      .toggleEmployeeStatus(employee.employee_id as string, newStatus)
      .subscribe({
        next: (response) => {
          console.log('Toggle status SUCCESS:', response);
          // Update with response data to ensure sync with backend
          if (response.employment_status !== undefined) {
            employee.employment_status = response.employment_status;
          }
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Employee ${newStatus ? 'activated' : 'deactivated'} successfully`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (error) => {
          console.error('Toggle status FAILED - Full error:', error);
          // Revert status on error
          employee.employment_status = oldStatus;
          console.log('Reverted employment_status back to:', oldStatus);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: `Failed to update employee status: ${error.error?.message || error.message || 'Unknown error'}`,
          });
        },
      });
  }

  getFullName(employee: Employee): string {
    return `${employee.first_name} ${employee.last_name}`;
  }
}
