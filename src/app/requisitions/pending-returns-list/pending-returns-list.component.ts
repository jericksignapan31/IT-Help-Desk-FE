import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WarehouseService } from '../../services/warehouse.service';
import { AuthService } from '../../services/auth.service';
import { PartRequisition } from '../../models/requisition.model';
import { UserRole } from '../../models/user.model';
import { ResubmitRequisitionDialogComponent } from '../resubmit-requisition-dialog/resubmit-requisition-dialog.component';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-pending-returns-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './pending-returns-list.component.html',
  styleUrls: ['./pending-returns-list.component.scss'],
})
export class PendingReturnsListComponent implements OnInit, OnDestroy {
  requisitions: PartRequisition[] = [];
  loading = false;
  isIT = false;
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['rf_number', 'department', 'items_count', 'returned_date', 'status', 'actions'];

  constructor(
    private warehouseService: WarehouseService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.isIT = this.authService.currentUserValue?.role === UserRole.IT;
  }

  ngOnInit(): void {
    this.loadPendingReturns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPendingReturns(): void {
    this.loading = true;
    this.warehouseService
      .getPendingReturns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requisitions) => {
          this.requisitions = requisitions.filter(r => r.status === 'returned_by_warehouse');
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading pending returns:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load pending returns',
          });
          this.loading = false;
        },
      });
  }

  viewDetails(requisition: PartRequisition): void {
    let itemsHtml = '<table style="width: 100%; border-collapse: collapse; text-align: left;"><thead><tr><th style="border: 1px solid #ddd; padding: 8px;">Item</th><th style="border: 1px solid #ddd; padding: 8px;">Qty</th><th style="border: 1px solid #ddd; padding: 8px;">Unit</th><th style="border: 1px solid #ddd; padding: 8px;">Supplier</th><th style="border: 1px solid #ddd; padding: 8px;">Cost</th></tr></thead><tbody>';
    
    requisition.items?.forEach((item) => {
      itemsHtml += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.item_name}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.unit}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.supplier || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">₱${this.calculateItemTotal(item.quantity, item.unit_cost)}</td>
        </tr>
      `;
    });
    
    itemsHtml += '</tbody></table>';

    // Get warehouse notes from returns array
    const warehouseNotes = requisition.returns?.[0]?.warehouse_notes;
    const departmentName = typeof requisition.department === 'object' ? requisition.department?.department_name : requisition.department;

    let warehouseNotesSection = '';
    if (this.isIT && warehouseNotes) {
      warehouseNotesSection = `
        <div style="background-color: #f0f7ff; padding: 1rem; border-radius: 4px; border-left: 3px solid #2196F3; margin: 1rem 0;">
          <strong style="color: #1976d2;">Warehouse Notes:</strong>
          <p style="margin: 0.5rem 0 0 0; color: #555;">${warehouseNotes}</p>
        </div>
      `;
    }

    Swal.fire({
      title: `Requisition ${requisition.rf_number}`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Department:</strong> ${departmentName || 'N/A'}</p>
          <p><strong>Status:</strong> ${requisition.status}</p>
          <p><strong>Returned:</strong> ${this.formatDate(requisition.updated_at)}</p>
          <hr/>
          <h4 style="margin: 15px 0 10px 0;">Items</h4>
          ${itemsHtml}
          ${warehouseNotesSection}
        </div>
      `,
      icon: 'info',
      width: '700px',
      confirmButtonText: 'Close',
    });
  }

  resubmitRequisition(requisition: PartRequisition): void {
    const dialogRef = this.dialog.open(ResubmitRequisitionDialogComponent, {
      width: '800px',
      data: { requisition },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.loadPendingReturns();
      }
    });
  }

  getItemsSummary(requisition: PartRequisition): string {
    if (!requisition.items || requisition.items.length === 0) {
      return 'No items';
    }
    return `${requisition.items.length} item${requisition.items.length > 1 ? 's' : ''}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  calculateItemTotal(quantity: number | undefined, unitCost: number | string | undefined): string {
    const qty = quantity || 0;
    const cost = typeof unitCost === 'string' ? parseFloat(unitCost) || 0 : unitCost || 0;
    return (qty * cost).toFixed(2);
  }
}
