import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';
import { DepartmentDialogComponent } from '../department-dialog/department-dialog.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.scss'],
})
export class DepartmentListComponent implements OnInit {
  departments: Department[] = [];
  displayedColumns: string[] = [
    'department_name',
    'description',
    'status',
    'actions',
  ];
  isLoading = false;

  constructor(
    private departmentService: DepartmentService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading = true;
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to load departments',
        });
        this.isLoading = false;
      },
    });
  }

  createDepartment(): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '600px',
      data: {
        isEditMode: false,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadDepartments();
      }
    });
  }

  editDepartment(department: Department): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '600px',
      data: {
        department: department,
        isEditMode: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadDepartments();
      }
    });
  }

  deleteDepartment(department: Department): void {
    console.log('Delete button clicked for department:', department);
    console.log('Department ID:', department.department_id);

    Swal.fire({
      title: 'Delete Department',
      text: `Are you sure you want to delete "${department.department_name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      console.log('SweetAlert result:', result);
      if (result.isConfirmed && department.department_id) {
        console.log(
          'Calling deleteDepartment API with ID:',
          department.department_id,
        );
        this.departmentService
          .deleteDepartment(department.department_id)
          .subscribe({
            next: (response) => {
              console.log('Delete SUCCESS - Response:', response);
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Department deleted successfully',
                timer: 2000,
                showConfirmButton: false,
              });
              this.loadDepartments();
            },
            error: (error) => {
              console.error('Delete FAILED - Full error:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: `Failed to delete department: ${error.error?.message || error.message || 'Unknown error'}`,
              });
            },
          });
      }
    });
  }

  toggleStatus(department: Department): void {
    if (!department.department_id) {
      console.log('No department department_id found:', department);
      return;
    }

    console.log('Toggle status for department:', department);
    console.log('Current status:', department.status);

    const oldStatus = department.status;
    const newStatus = department.status === 'active' ? 'inactive' : 'active';

    // Optimistic UI update - change status immediately
    department.status = newStatus;
    console.log('Updated UI to new status:', newStatus);

    this.departmentService
      .toggleDepartmentStatus(department.department_id, newStatus)
      .subscribe({
        next: (response) => {
          console.log('Toggle status SUCCESS:', response);
          // Update with response data to ensure sync with backend
          if (response.status) {
            department.status = response.status;
          }
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Department ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (error) => {
          console.error('Toggle status FAILED - Full error:', error);
          // Revert status on error
          department.status = oldStatus;
          console.log('Reverted status back to:', oldStatus);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: `Failed to update department status: ${error.error?.message || error.message || 'Unknown error'}`,
          });
        },
      });
  }
}
