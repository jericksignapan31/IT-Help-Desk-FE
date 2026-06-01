import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import { WarehouseService } from '../../services/warehouse.service';
import { DepartmentService } from '../../services/department.service';
import { PartRequisition } from '../../models/requisition.model';
import { Department } from '../../models/department.model';
import { ApproveRequisitionModalComponent } from '../approve-requisition-modal/approve-requisition-modal.component';
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
  ],
  templateUrl: './pending-admin-review.component.html',
  styleUrls: ['./pending-admin-review.component.scss'],
})
export class PendingAdminReviewComponent implements OnInit, OnDestroy {
  requisitions: PartRequisition[] = [];
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
          console.log('✅ Pending admin review data loaded:', data);
          this.requisitions = data;
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

  getDepartmentName(departmentId: string | undefined): string {
    if (!departmentId) return 'N/A';
    const dept = this.departments.find((d) => d.department_id === departmentId);
    return dept ? dept.department_name : departmentId;
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
    let itemsHtml = '<table style="width: 100%; text-align: left;"><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Supplier</th><th>Unit Cost</th><th>Total</th></tr>';
    requisition.items?.forEach((item) => {
      const unitCost = typeof item.unit_cost === 'string' ? parseFloat(item.unit_cost) : item.unit_cost;
      const totalCost = typeof item.total_cost === 'string' ? parseFloat(item.total_cost) : item.total_cost;
      itemsHtml += `<tr>
        <td>${item.item_name}</td>
        <td>${item.quantity}</td>
        <td>${item.unit}</td>
        <td>${item.supplier}</td>
        <td>${this.formatCurrency(unitCost || 0)}</td>
        <td>${this.formatCurrency(totalCost || 0)}</td>
      </tr>`;
    });
    itemsHtml += '</table>';

    Swal.fire({
      title: `Requisition ${requisition.rf_number}`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Requester:</strong> ${this.getRequesterName(requisition)}</p>
          <p><strong>Department:</strong> ${this.getDepartmentName(requisition.department)}</p>
          <p><strong>Warehouse Acknowledger:</strong> ${this.getAcknowledgerName(requisition)}</p>
          <p><strong>Acknowledged Notes:</strong> ${requisition.acknowledged_notes || 'N/A'}</p>
          <p><strong>Items Count:</strong> ${this.getItemsCount(requisition)}</p>
          <p><strong>Total Cost:</strong> ${this.formatCurrency(this.calculateTotalCost(requisition))}</p>
          <p><strong>Created:</strong> ${this.formatDate(requisition.created_at)}</p>
          <p><strong>Acknowledged:</strong> ${this.formatDate(requisition.acknowledged_at || '')}</p>
          <p><strong>Deadline:</strong> ${requisition.deadline ? this.formatDate(requisition.deadline) : 'N/A'}</p>
          <hr>
          <h4>Items Details</h4>
          ${itemsHtml}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close',
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
              console.error('Error processing requisition:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to process requisition',
              });
            },
          });
      }
    });
  }
}
