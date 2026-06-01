import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { WarehouseService } from '../../services/warehouse.service';
import { PartRequisition } from '../../models/requisition.model';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-my-requisitions-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatCardModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
  ],
  templateUrl: './my-requisitions-list.component.html',
  styleUrls: ['./my-requisitions-list.component.scss'],
})
export class MyRequisitionsListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() refreshTrigger = 0;

  requisitions: PartRequisition[] = [];
  dataSource = new MatTableDataSource<PartRequisition>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  loading = true;
  error: string = '';

  displayedColumns: string[] = [
    'rf_number',
    'department',
    'status',
    'items_count',
    'total_cost',
    'created_at',
    'actions',
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private warehouseService: WarehouseService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadMyRequisitions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      this.loadMyRequisitions();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMyRequisitions(): void {
    this.loading = true;
    this.error = '';

    this.warehouseService
      .getMyRequisitions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.requisitions = data;
          this.dataSource.data = data;
          this.dataSource.paginator = this.paginator;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load requisitions';
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.error,
          });
          this.loading = false;
        },
      });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warn';
      case 'pending_admin_review':
        return 'accent';
      case 'approved':
        return 'primary';
      case 'rejected':
        return '';
      default:
        return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'pending_admin_review':
        return 'pending_actions';
      case 'approved':
        return 'check_circle';
      case 'rejected':
        return 'cancel';
      default:
        return 'help';
    }
  }

  getItemsCount(requisition: PartRequisition): number {
    return requisition.items?.length || 0;
  }

  calculateTotalCost(requisition: PartRequisition): number {
    return (requisition.items || []).reduce((sum, item) => {
      const cost = typeof item.total_cost === 'string' 
        ? parseFloat(item.total_cost) 
        : (item.total_cost || 0);
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
    });
  }

  viewDetail(requisition: PartRequisition): void {
    let itemsHtml = `
      <table style="width: 100%; text-align: left; font-size: 0.9rem;">
        <tr style="border-bottom: 1px solid #ddd;">
          <th>Item</th>
          <th>Qty</th>
          <th>Unit Cost</th>
          <th>Total</th>
        </tr>
    `;

    (requisition.items || []).forEach((item) => {
      const unitCost = typeof item.unit_cost === 'string' 
        ? parseFloat(item.unit_cost) 
        : (item.unit_cost || 0);
      const totalCost = typeof item.total_cost === 'string' 
        ? parseFloat(item.total_cost) 
        : (item.total_cost || 0);
      
      itemsHtml += `
        <tr style="border-bottom: 1px solid #eee;">
          <td>${item.item_name}</td>
          <td>${item.quantity} ${item.unit}</td>
          <td>₱${unitCost.toFixed(2)}</td>
          <td>₱${totalCost.toFixed(2)}</td>
        </tr>
      `;
    });

    itemsHtml += '</table>';

    const html = `
      <div style="text-align: left;">
        <p><strong>RF Number:</strong> ${requisition.rf_number}</p>
        <p><strong>Department:</strong> ${requisition.department || 'N/A'}</p>
        <p><strong>Status:</strong> <span style="color: #667eea; font-weight: bold;">${requisition.status.toUpperCase()}</span></p>
        <p><strong>Created:</strong> ${this.formatDate(requisition.created_at)}</p>
        ${requisition.deadline ? `<p><strong>Deadline:</strong> ${this.formatDate(requisition.deadline)}</p>` : ''}
        ${requisition.acknowledged_notes ? `<p><strong>Warehouse Notes:</strong> ${requisition.acknowledged_notes}</p>` : ''}
        ${requisition.rejection_reason ? `<p><strong>Rejection Reason:</strong> ${requisition.rejection_reason}</p>` : ''}
        <p style="margin-top: 1rem;"><strong>Items:</strong></p>
        ${itemsHtml}
        <p style="margin-top: 1rem; text-align: right;"><strong>Total: ${this.formatCurrency(this.calculateTotalCost(requisition))}</strong></p>
      </div>
    `;

    Swal.fire({
      title: `Requisition Details`,
      html,
      icon: 'info',
      width: '600px',
      confirmButtonText: 'Close',
    });
  }
}
