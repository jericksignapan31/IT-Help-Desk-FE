import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { WarehouseService } from '../../services/warehouse.service';
import { PartRequisition } from '../../models/requisition.model';
import { CommentThreadComponent } from '../comment-thread/comment-thread.component';
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
    MatExpansionModule,
    CommentThreadComponent,
  ],
  templateUrl: './pending-returns-list.component.html',
  styleUrls: ['./pending-returns-list.component.scss'],
})
export class PendingReturnsListComponent implements OnInit, OnDestroy {
  requisitions: PartRequisition[] = [];
  loading = false;
  expandedRfNumber: string | null = null;
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['rf_number', 'department', 'created_at', 'items_count', 'actions'];

  constructor(
    private warehouseService: WarehouseService,
    private dialog: MatDialog
  ) {}

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

  toggleExpand(rfNumber: string): void {
    this.expandedRfNumber = this.expandedRfNumber === rfNumber ? null : rfNumber;
  }

  resubmitRequisition(rfNumber: string): void {
    Swal.fire({
      title: 'Confirm Resubmit',
      text: 'Are you sure you want to resubmit this requisition? The warehouse will need to acknowledge it again.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Resubmit',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.warehouseService.resubmitRequisition(rfNumber, {}).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Resubmitted',
              text: `Requisition ${rfNumber} has been resubmitted`,
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadPendingReturns();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'Failed to resubmit requisition',
            });
          },
        });
      }
    });
  }

  viewHistory(rfNumber: string): void {
    this.warehouseService.getRequisitionHistory(rfNumber).subscribe({
      next: (history) => {
        let historyHtml = '<div style="text-align: left; max-height: 400px; overflow-y: auto;">';
        
        history.forEach((item, index) => {
          historyHtml += `
            <div style="margin-bottom: 1.5rem; padding: 1rem; border-left: 3px solid #2196F3;">
              <strong>Return Cycle ${item.return_cycle}</strong>
              <p><strong>Warehouse Notes:</strong> ${item.warehouse_notes}</p>
              <p><strong>Returned:</strong> ${new Date(item.created_at).toLocaleString()}</p>
              ${item.resubmitted_at ? `<p><strong>Resubmitted:</strong> ${new Date(item.resubmitted_at).toLocaleString()}</p>` : ''}
              ${item.comments && item.comments.length > 0 ? `
                <strong>Comments (${item.comments.length}):</strong>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                  ${item.comments.map(c => `<li>${c.role.toUpperCase()}: ${c.message}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `;
        });
        
        historyHtml += '</div>';

        Swal.fire({
          title: `Requisition History - ${rfNumber}`,
          html: historyHtml,
          icon: 'info',
          width: '600px',
          confirmButtonText: 'Close',
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load history',
        });
      },
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
