import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { DepartmentService } from '../../services/department.service';
import { AuthService } from '../../services/auth.service';
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
    MatPaginatorModule,
  ],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.scss'],
})
export class DepartmentListComponent implements OnInit, AfterViewInit {
  departments: Department[] = [];
  dataSource = new MatTableDataSource<Department>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  displayedColumns: string[] = [
    'department_name',
    'description',
    'status',
    'actions',
  ];
  isLoading = false;

  constructor(
    private departmentService: DepartmentService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    // Initialize - paginator connection happens in AfterViewInit
  }

  ngAfterViewInit(): void {
    // Set paginator connection FIRST
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    // THEN load data
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading = true;
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.dataSource.data = departments;
        this.isLoading = false;
      },
      error: (error) => {
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
      if (result.isConfirmed && department.department_id) {
      
        this.departmentService
          .deleteDepartment(department.department_id)
          .subscribe({
            next: (response) => {
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
      return;
    }

    const newIsActive = !department.is_active;

    // Optimistic UI update
    department.is_active = newIsActive;

    this.departmentService
      .toggleDepartmentStatus(department.department_id, newIsActive)
      .subscribe({
        next: (response) => {
          department.is_active = response.is_active;
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Department ${newIsActive ? 'activated' : 'deactivated'} successfully`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (error) => {
          // Revert on error
          department.is_active = !newIsActive;
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: `Failed to update department status: ${error.error?.message || error.message || 'Unknown error'}`,
          });
        },
      });
  }
}
