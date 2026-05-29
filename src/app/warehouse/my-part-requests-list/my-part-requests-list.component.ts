import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { WarehouseService, WarehousePartRequest } from '../../services/warehouse.service';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-my-part-requests-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatCardModule,
  ],
  templateUrl: './my-part-requests-list.component.html',
  styleUrls: ['./my-part-requests-list.component.scss'],
})
export class MyPartRequestsListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() refreshTrigger = 0;

  requests: WarehousePartRequest[] = [];
  loading = true;
  error: string = '';

  displayedColumns: string[] = [
    'part_name',
    'quantity',
    'unit_cost',
    'total_cost',
    'supplier',
    'status',
    'requested_at',
    'approved_at',
    'rejection_reason',
  ];

  private destroy$ = new Subject<void>();

  constructor(private warehouseService: WarehouseService) {}

  ngOnInit(): void {
    this.loadMyRequests();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload when refreshTrigger changes (form submitted)
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      this.loadMyRequests();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMyRequests(): void {
    this.loading = true;
    this.error = '';

    this.warehouseService
      .getMyPartRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.requests = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load requests';
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
      case 'approved':
        return 'primary';
      case 'rejected':
        return 'accent';
      default:
        return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'approved':
        return 'check_circle';
      case 'rejected':
        return 'cancel';
      default:
        return 'help';
    }
  }

  formatCurrency(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `₱${numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  viewDetails(request: WarehousePartRequest): void {
    let details = `
      <div style="text-align: left;">
        <p><strong>Part Name:</strong> ${request.part_name}</p>
        <p><strong>Quantity:</strong> ${request.quantity}</p>
        <p><strong>Unit Cost:</strong> ${this.formatCurrency(request.unit_cost)}</p>
        <p><strong>Total Cost:</strong> ${this.formatCurrency(request.total_cost)}</p>
        <p><strong>Supplier:</strong> ${request.supplier}</p>
        <p><strong>Status:</strong> ${request.status.toUpperCase()}</p>
        <p><strong>Requested:</strong> ${this.formatDate(request.requested_at)}</p>
        <p><strong>Approved:</strong> ${this.formatDate(request.approved_at)}</p>
        ${request.rejection_reason ? `<p><strong>Rejection Reason:</strong> ${request.rejection_reason}</p>` : ''}
        ${request.notes ? `<p><strong>Notes:</strong> ${request.notes}</p>` : ''}
      </div>
    `;

    Swal.fire({
      title: 'Part Request Details',
      html: details,
      icon: 'info',
      confirmButtonText: 'Close',
    });
  }
}
