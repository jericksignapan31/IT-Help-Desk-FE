import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './employee-view-dialog.component.html',
  styleUrls: ['./employee-view-dialog.component.scss'],
})
export class EmployeeViewDialogComponent implements OnInit {
  employee: Employee | null = null;
  loading = false;
  error = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { employeeId: string | number },
    private employeeService: EmployeeService,
    private dialogRef: MatDialogRef<EmployeeViewDialogComponent>,
  ) {}

  ngOnInit(): void {
    this.loadEmployeeDetails();
  }

  loadEmployeeDetails(): void {
    this.loading = true;
    this.error = '';

    this.employeeService.getEmployee(this.data.employeeId).subscribe({
      next: (data) => {
        this.employee = data;
        this.loading = false;
        console.log('========== EMPLOYEE VIEW DATA ==========');
        console.log('Full Employee Object:', JSON.stringify(data, null, 2));
        console.log('Branch object:', data.branch);
        console.log('Department object:', data.department);
        console.log('=======================================');
      },
      error: (err) => {
        console.error('Failed to load employee details:', err);
        this.error = 'Failed to load employee details';
        this.loading = false;
      },
    });
  }

  getFullName(): string {
    if (!this.employee) return '';
    const { first_name, middle_name, last_name } = this.employee;
    return middle_name
      ? `${first_name} ${middle_name} ${last_name}`
      : `${first_name} ${last_name}`;
  }

  getRoleBadgeClass(): string {
    const role = this.employee?.role?.toLowerCase();
    if (role === 'admin') return 'role-admin';
    if (role === 'technician') return 'role-technician';
    return 'role-user';
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  toggleStatus(): void {
    if (!this.employee?.employee_id) {
      console.log('No employee employee_id found:', this.employee);
      return;
    }

    const currentStatus = this.employee.employment_status;
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';

    Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Employee?`,
      text: `Are you sure you want to ${action} this employee?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#4caf50' : '#f44336',
      cancelButtonColor: '#757575',
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && this.employee) {
        console.log('Toggle status for employee:', this.employee);
        console.log('Current employment_status:', currentStatus);

        // Optimistic UI update
        this.employee.employment_status = newStatus;
        console.log('Updated UI to new employment_status:', newStatus);

        this.employeeService
          .toggleEmployeeStatus(this.employee.employee_id as string, newStatus)
          .subscribe({
            next: (response) => {
              console.log('Toggle status SUCCESS:', response);
              if (this.employee && response.employment_status !== undefined) {
                this.employee.employment_status = response.employment_status;
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
              if (this.employee) {
                this.employee.employment_status = currentStatus;
              }
              console.log('Reverted employment_status back to:', currentStatus);
              Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: `Failed to ${action} employee: ${
                  error.error?.message || error.message || 'Unknown error'
                }`,
              });
            },
          });
      }
    });
  }
}
