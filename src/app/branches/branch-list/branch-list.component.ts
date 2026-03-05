import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BranchService } from '../../services/branch.service';
import { Branch } from '../../models/branch.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { BranchDialogComponent } from '../branch-dialog/branch-dialog.component';

@Component({
  selector: 'app-branch-list',
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
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss'],
})
export class BranchListComponent implements OnInit {
  branches: Branch[] = [];
  displayedColumns: string[] = [
    'branch_name',
    'location',
    'contact_number',
    'status',
    'actions',
  ];
  isLoading = false;

  constructor(
    private branchService: BranchService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.isLoading = true;
    this.branchService.getAllBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading branches:', error);
        this.snackBar.open('Failed to load branches', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  createBranch(): void {
    const dialogRef = this.dialog.open(BranchDialogComponent, {
      width: '600px',
      data: {
        isEditMode: false,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadBranches();
      }
    });
  }

  editBranch(branch: Branch): void {
    const dialogRef = this.dialog.open(BranchDialogComponent, {
      width: '600px',
      data: {
        branch: branch,
        isEditMode: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadBranches();
      }
    });
  }

  deleteBranch(branch: Branch): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Branch',
        message: `Are you sure you want to delete "${branch.branch_name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && branch.id) {
        this.branchService.deleteBranch(branch.id).subscribe({
          next: () => {
            this.snackBar.open('Branch deleted successfully', 'Close', {
              duration: 3000,
            });
            this.loadBranches();
          },
          error: (error) => {
            console.error('Error deleting branch:', error);
            this.snackBar.open('Failed to delete branch', 'Close', {
              duration: 3000,
            });
          },
        });
      }
    });
  }

  toggleStatus(branch: Branch): void {
    if (!branch.id) return;

    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    this.branchService.toggleBranchStatus(branch.id, newStatus).subscribe({
      next: () => {
        this.snackBar.open(
          `Branch ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
          'Close',
          { duration: 3000 },
        );
        this.loadBranches();
      },
      error: (error) => {
        console.error('Error updating branch status:', error);
        this.snackBar.open('Failed to update branch status', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
