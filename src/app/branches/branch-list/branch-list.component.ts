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
import { BranchService } from '../../services/branch.service';
import { Branch } from '../../models/branch.model';
import { BranchDialogComponent } from '../branch-dialog/branch-dialog.component';
import Swal from 'sweetalert2';

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
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to load branches',
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
    console.log('Delete button clicked for branch:', branch);
    console.log('Branch ID:', branch.branch_id);
    console.log('Branch object:', JSON.stringify(branch, null, 2));

    Swal.fire({
      title: 'Delete Branch',
      text: `Are you sure you want to delete "${branch.branch_name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      console.log('SweetAlert result:', result);
      console.log('Is confirmed:', result.isConfirmed);
      console.log('Has branch.branch_id:', !!branch.branch_id);

      if (result.isConfirmed && branch.branch_id) {
        console.log('Calling deleteBranch API with ID:', branch.branch_id);
        console.log(
          'API URL will be:',
          `${this.branchService['API_URL']}/${branch.branch_id}`,
        );

        this.branchService.deleteBranch(branch.branch_id).subscribe({
          next: (response) => {
            console.log('Delete SUCCESS - Response:', response);
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Branch deleted successfully',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadBranches();
          },
          error: (error) => {
            console.error('Delete FAILED - Full error:', error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.message);
            console.error('Error body:', error.error);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: `Failed to delete branch: ${error.error?.message || error.message || 'Unknown error'}`,
            });
          },
        });
      } else {
        console.log('Delete cancelled or no branch ID');
      }
    });
  }

  toggleStatus(branch: Branch): void {
    if (!branch.branch_id) {
      console.log('No branch_id found:', branch);
      return;
    }

    console.log('Toggle status for branch:', branch);
    console.log('Current status:', branch.status);

    const oldStatus = branch.status;
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';

    // Optimistic UI update - change status immediately
    branch.status = newStatus;
    console.log('Updated UI to new status:', newStatus);
    console.log('Calling API with branch_id:', branch.branch_id);

    this.branchService
      .toggleBranchStatus(branch.branch_id, newStatus)
      .subscribe({
        next: (response) => {
          console.log('Toggle status SUCCESS:', response);
          // Update with response data to ensure sync with backend
          if (response.status) {
            branch.status = response.status;
          }
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Branch ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (error) => {
          console.error('Toggle status FAILED - Full error:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error body:', error.error);

          // Revert status on error
          branch.status = oldStatus;
          console.log('Reverted status back to:', oldStatus);

          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: `Failed to update branch status: ${error.error?.message || error.message || 'Unknown error'}`,
          });
        },
      });
  }
}
