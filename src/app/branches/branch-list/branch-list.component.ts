import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
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
    MatPaginatorModule,
  ],
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss'],
})
export class BranchListComponent implements OnInit, AfterViewInit {
  branches: Branch[] = [];
  dataSource = new MatTableDataSource<Branch>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
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
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Initialize - paginator connection happens in AfterViewInit
  }

  ngAfterViewInit(): void {
    // Set paginator connection FIRST
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    // THEN load data
    this.loadBranches();
  }

  loadBranches(): void {
    this.isLoading = true;
    this.branchService.getAllBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
        this.dataSource.data = branches;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to load branches',
        });
        this.isLoading = false;
        this.cdr.detectChanges();
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
 ;

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
     

      if (result.isConfirmed && branch.branch_id) {
     

        this.branchService.deleteBranch(branch.branch_id).subscribe({
          next: (response) => {
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
         
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: `Failed to delete branch: ${error.error?.message || error.message || 'Unknown error'}`,
            });
          },
        });
      } else {
      }
    });
  }

  toggleStatus(branch: Branch): void {
    if (!branch.branch_id) {
      return;
    }

   

    const oldStatus = branch.status;
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';

    // Optimistic UI update - change status immediately
    branch.status = newStatus;

    this.branchService
      .toggleBranchStatus(branch.branch_id, newStatus)
      .subscribe({
        next: (response) => {
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
          

          // Revert status on error
          branch.status = oldStatus;

          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: `Failed to update branch status: ${error.error?.message || error.message || 'Unknown error'}`,
          });
        },
      });
  }
}
