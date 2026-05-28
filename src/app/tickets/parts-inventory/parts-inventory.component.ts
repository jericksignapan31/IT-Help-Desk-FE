import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { TicketPart } from '../../models/ticket-part.model';
import { TicketService } from '../../services/ticket.service';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-parts-inventory',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
  ],
  templateUrl: './parts-inventory.component.html',
  styleUrls: ['./parts-inventory.component.scss'],
})
export class PartsInventoryComponent implements OnInit, OnDestroy {
  parts: TicketPart[] = [];
  filteredParts: TicketPart[] = [];
  loading = true;
  error: string = '';
  
  filterType: 'all' | 'status' | 'supplier' = 'all';
  selectedStatus: 'pending' | 'ordered' | 'received' = 'pending';
  selectedSupplier: string = '';
  suppliers: string[] = [];
  
  displayedColumns: string[] = [
    'part_name',
    'quantity',
    'unit_cost',
    'total_cost',
    'supplier',
    'status',
    'requested_date',
    'received_date',
    'ticket_subject',
  ];

  private destroy$ = new Subject<void>();

  constructor(private ticketService: TicketService) {}

  ngOnInit(): void {
    this.loadAllParts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllParts(): void {
    this.loading = true;
    this.error = '';
    this.filterType = 'all';

    this.ticketService
      .getAllParts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (parts) => {
          this.parts = parts;
          this.filteredParts = parts;
          this.extractSuppliers();
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load parts inventory';
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.error,
          });
          this.loading = false;
        },
      });
  }

  filterByStatus(status: 'pending' | 'ordered' | 'received'): void {
    this.loading = true;
    this.error = '';
    this.filterType = 'status';
    this.selectedStatus = status;

    this.ticketService
      .getPartsByStatus(status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (parts) => {
          this.filteredParts = parts;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || `Failed to load ${status} parts`;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.error,
          });
          this.loading = false;
        },
      });
  }

  filterBySupplier(supplier: string): void {
    if (!supplier) {
      this.loadAllParts();
      return;
    }

    this.loading = true;
    this.error = '';
    this.filterType = 'supplier';
    this.selectedSupplier = supplier;

    this.ticketService
      .getPartsBySupplier(supplier)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (parts) => {
          this.filteredParts = parts;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || `Failed to load parts from ${supplier}`;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.error,
          });
          this.loading = false;
        },
      });
  }

  private extractSuppliers(): void {
    const uniqueSuppliers = new Set(this.parts.map((p) => p.supplier));
    this.suppliers = Array.from(uniqueSuppliers).sort();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warn';
      case 'ordered':
        return 'accent';
      case 'received':
        return 'primary';
      default:
        return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'ordered':
        return 'local_shipping';
      case 'received':
        return 'check_circle';
      default:
        return 'help';
    }
  }

  formatCurrency(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `₱${numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  get totalInventoryCost(): number {
    return this.filteredParts.reduce((sum, part) => {
      const cost = typeof part.total_cost === 'string' ? parseFloat(part.total_cost) : part.total_cost;
      return sum + (cost || 0);
    }, 0);
  }

  get pendingCount(): number {
    return this.parts.filter((p) => p.status === 'pending').length;
  }

  get orderedCount(): number {
    return this.parts.filter((p) => p.status === 'ordered').length;
  }

  get receivedCount(): number {
    return this.parts.filter((p) => p.status === 'received').length;
  }
}
