import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { WarehouseService } from '../../services/warehouse.service';
import { DepartmentService } from '../../services/department.service';
import { PartRequisition } from '../../models/requisition.model';
import { Department } from '../../models/department.model';
import { ApproveRequisitionModalComponent } from '../approve-requisition-modal/approve-requisition-modal.component';
import { RequisitionDetailDialogComponent } from '../requisition-detail-dialog/requisition-detail-dialog.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-pending-admin-review',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
  ],
  templateUrl: './pending-admin-review.component.html',
  styleUrls: ['./pending-admin-review.component.scss'],
})
export class PendingAdminReviewComponent implements OnInit, OnDestroy {
  requisitions: PartRequisition[] = [];
  dataSource = new MatTableDataSource<PartRequisition>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  departments: Department[] = [];
  displayedColumns: string[] = [
    'rf_number',
    'requester',
    'warehouse_acknowledger',
    'items_count',
    'total_cost',
    'acknowledged_at',
    'actions',
  ];
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private warehouseService: WarehouseService,
    private departmentService: DepartmentService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
    this.loadPendingAdminReview();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDepartments(): void {
    this.departmentService
      .getAllDepartments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.departments = data;
        },
        error: (err) => {
          console.error('Error loading departments:', err);
        },
      });
  }

  loadPendingAdminReview(): void {
    this.isLoading = true;
    this.warehouseService
      .getPendingAdminReview()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ All requisitions loaded:', data);
          // Filter to only pending_admin_review status
          this.requisitions = data.filter((req) => req.status === 'pending_admin_review');
          this.dataSource.data = this.requisitions;
          this.dataSource.paginator = this.paginator;
          console.log('✅ Filtered to pending_admin_review:', this.requisitions);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error loading pending admin review:', err);
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load requisitions pending admin review',
          });
        },
      });
  }

  getDepartmentName(department: string | { department_id: string; department_name: string; description: string; is_active: boolean; created_at: string; updated_at: string; } | undefined): string {
    if (!department) return 'N/A';
    
    // If department is an object with department_name
    if (typeof department === 'object' && department.department_name) {
      return department.department_name;
    }
    
    // If department is a string (ID), look it up in the departments array
    if (typeof department === 'string') {
      const dept = this.departments.find((d) => d.department_id === department);
      return dept ? dept.department_name : department;
    }
    
    return 'N/A';
  }

  getRequesterName(requisition: PartRequisition): string {
    if (!requisition.requester) return 'N/A';
    const { first_name, last_name } = requisition.requester;
    return [first_name, last_name].filter(Boolean).join(' ');
  }

  getAcknowledgerName(requisition: PartRequisition): string {
    if (!requisition.acknowledger) return 'Not yet acknowledged';
    const { first_name, last_name } = requisition.acknowledger;
    return [first_name, last_name].filter(Boolean).join(' ');
  }

  getItemsCount(requisition: PartRequisition): number {
    return requisition.items?.length || 0;
  }

  calculateTotalCost(requisition: PartRequisition): number {
    return requisition.items?.reduce((total, item) => {
      const itemTotal = typeof item.total_cost === 'string' 
        ? parseFloat(item.total_cost) 
        : item.total_cost;
      return total + (itemTotal || 0);
    }, 0) || 0;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  }

  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  viewDetails(requisition: PartRequisition): void {
    const dialogRef = this.dialog.open(RequisitionDetailDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        requisition,
        departments: this.departments,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action) {
        // Handle any actions if needed
        console.log('Dialog action:', result.action);
      }
    });
  }

  approveRequisition(requisition: PartRequisition): void {
    const dialogRef = this.dialog.open(ApproveRequisitionModalComponent, {
      width: '600px',
      data: { requisition },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.warehouseService
          .approveRequisition(requisition.rf_number!, result)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `Requisition ${result.action === 'approved' ? 'approved' : 'rejected'} successfully`,
              });
              this.loadPendingAdminReview();
            },
            error: (err) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.error?.message || 'Failed to update requisition',
              });
            },
          });
      }
    });
  }

  declineRequisition(requisition: PartRequisition): void {
    Swal.fire({
      title: 'Decline Requisition?',
      text: `Are you sure you want to decline requisition ${requisition.rf_number}?`,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Decline Reason',
      inputPlaceholder: 'Enter the reason for declining this requisition...',
      inputAttributes: {
        'aria-label': 'Decline reason'
      },
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Please provide a decline reason';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Yes, Decline',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.warehouseService
          .declineRequisition(requisition.rf_number, result.value)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Declined',
                text: 'Requisition declined successfully',
              }).then(() => {
                this.loadPendingAdminReview();
              });
            },
            error: (err) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.error?.message || 'Failed to decline requisition',
              });
            },
          });
      }
    });
  }
}
