import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { WarehouseService } from '../../services/warehouse.service';
import { DepartmentService } from '../../services/department.service';
import { PartRequisition } from '../../models/requisition.model';
import { Department } from '../../models/department.model';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AcknowledgeRequisitionModalComponent } from '../acknowledge-requisition-modal/acknowledge-requisition-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-pending-requisitions',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
  ],
  templateUrl: './pending-requisitions.component.html',
  styleUrls: ['./pending-requisitions.component.scss'],
})
export class PendingRequisitionsComponent implements OnInit, OnDestroy {
  requisitions: PartRequisition[] = [];
  dataSource = new MatTableDataSource<PartRequisition>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  departments: Department[] = [];
  loading = false;
  displayedColumns: string[] = [
    'rf_number',
    'requester',
    'department',
    'deadline',
    'items_count',
    'total_cost',
    'created_at',
    'actions',
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private warehouseService: WarehouseService,
    private departmentService: DepartmentService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
    this.loadPendingRequisitions();
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

  getDepartmentName(departmentId: string | undefined): string {
    if (!departmentId) return 'N/A';
    const dept = this.departments.find((d) => d.department_id === departmentId);
    return dept ? dept.department_name : departmentId;
  }

  loadPendingRequisitions(): void {
    this.loading = true;
    this.warehouseService
      .getPendingRequisitions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.requisitions = data;
          this.dataSource.data = data;
          this.dataSource.paginator = this.paginator;
          this.loading = false;
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Failed to load pending requisitions',
          });
          this.loading = false;
        },
      });
  }

  getItemsCount(requisition: PartRequisition): number {
    return requisition.items?.length || 0;
  }

  calculateTotalCost(requisition: PartRequisition): number {
    if (!requisition.items || requisition.items.length === 0) {
      return 0;
    }
    return requisition.items.reduce((sum, item) => {
      const cost = typeof item.total_cost === 'string'
        ? parseFloat(item.total_cost)
        : item.total_cost || 0;
      return sum + cost;
    }, 0);
  }

  formatCurrency(value: number): string {
    return `₱${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  acknowledgeRequisition(requisition: PartRequisition): void {
    const dialogRef = this.dialog.open(AcknowledgeRequisitionModalComponent, {
      width: '600px',
      data: { requisition },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('📝 Acknowledging with data:', result);
        this.warehouseService
          .acknowledgeRequisition(requisition.rf_number, {
            acknowledged_notes: result.notes,
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              console.log('✅ Acknowledge successful:', response);
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `Requisition ${requisition.rf_number} acknowledged successfully`,
                timer: 2000,
                showConfirmButton: false,
              });
              this.loadPendingRequisitions();
            },
            error: (err) => {
              console.error('❌ Acknowledge error:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.error?.message || 'Failed to acknowledge requisition',
              });
            },
          });
      }
    });
  }

  viewDetails(requisition: PartRequisition): void {
    Swal.fire({
      title: `Requisition ${requisition.rf_number}`,
      html: `
        <div style="text-align: left; font-size: 0.9rem;">
          <p><strong>Requested By:</strong> ${
            requisition.requester
              ? `${requisition.requester.first_name} ${requisition.requester.last_name}`
              : 'Unknown'
          }</p>
          <p><strong>Department:</strong> ${this.getDepartmentName(requisition.department) || 'N/A'}</p>
          <p><strong>Created:</strong> ${this.formatDate(requisition.created_at)}</p>
          <p><strong>Deadline:</strong> ${
            requisition.deadline ? this.formatDate(requisition.deadline) : 'N/A'
          }</p>
          <hr/>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead style="background: #f5f5f5;">
              <tr>
                <th style="border: 1px solid #ddd; padding: 4px;">Item</th>
                <th style="border: 1px solid #ddd; padding: 4px;">Qty</th>
                <th style="border: 1px solid #ddd; padding: 4px;">Unit</th>
                <th style="border: 1px solid #ddd; padding: 4px;">Cost</th>
              </tr>
            </thead>
            <tbody>
              ${requisition.items
                ?.map(
                  (item) => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 4px;">${item.item_name}</td>
                  <td style="border: 1px solid #ddd; padding: 4px;">${item.quantity}</td>
                  <td style="border: 1px solid #ddd; padding: 4px;">${item.unit}</td>
                  <td style="border: 1px solid #ddd; padding: 4px;">₱${
                    typeof item.total_cost === 'string'
                      ? parseFloat(item.total_cost).toFixed(2)
                      : (item.total_cost || 0).toFixed(2)
                  }</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <p style="margin-top: 12px;"><strong>Remarks:</strong> ${
            requisition.items?.[0]?.purpose_remarks || 'N/A'
          }</p>
        </div>
      `,
      confirmButtonText: 'Close',
    });
  }
}
