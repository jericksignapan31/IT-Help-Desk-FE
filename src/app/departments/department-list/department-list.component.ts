import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

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
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.scss'],
})
export class DepartmentListComponent implements OnInit {
  departments: Department[] = [];
  displayedColumns: string[] = [
    'name',
    'description',
    'branch',
    'head',
    'status',
    'actions',
  ];
  isLoading = false;

  constructor(
    private departmentService: DepartmentService,
    private router: Router,
    private snackBar: MatSnackBar,
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
        this.snackBar.open('Failed to load departments', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  createDepartment(): void {
    this.router.navigate(['/departments/create']);
  }

  editDepartment(department: Department): void {
    this.router.navigate(['/departments/edit', department.id]);
  }

  deleteDepartment(department: Department): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Department',
        message: `Are you sure you want to delete "${department.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && department.id) {
        this.departmentService.deleteDepartment(department.id).subscribe({
          next: () => {
            this.snackBar.open('Department deleted successfully', 'Close', {
              duration: 3000,
            });
            this.loadDepartments();
          },
          error: (error) => {
            console.error('Error deleting department:', error);
            this.snackBar.open('Failed to delete department', 'Close', {
              duration: 3000,
            });
          },
        });
      }
    });
  }

  toggleStatus(department: Department): void {
    if (!department.id) return;

    const newStatus = !department.is_active;
    this.departmentService
      .toggleDepartmentStatus(department.id, newStatus)
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Department ${newStatus ? 'activated' : 'deactivated'} successfully`,
            'Close',
            { duration: 3000 },
          );
          this.loadDepartments();
        },
        error: (error) => {
          console.error('Error updating department status:', error);
          this.snackBar.open('Failed to update department status', 'Close', {
            duration: 3000,
          });
        },
      });
  }
}
