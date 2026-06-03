import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import Swal from 'sweetalert2';
import { WarehouseService, RequisitionInventoryItem } from '../../services/warehouse.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './inventory-dashboard.component.html',
  styleUrls: ['./inventory-dashboard.component.scss'],
})
export class InventoryDashboardComponent implements OnInit, OnDestroy {
  allItems: RequisitionInventoryItem[] = [];
  filteredItems: RequisitionInventoryItem[] = [];
  dataSource = new MatTableDataSource<RequisitionInventoryItem>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  displayedColumns: string[] = [
    'rf_number',
    'item_name',
    'quantity',
    'unit',
    'supplier',
    'unit_cost',
    'total_cost',
    'status',
    'requester',
    'created_at',
    'actions',
  ];
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  // Filter properties
  filterItemName: string = '';
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  filterSupplier: string = '';
  filterStatus: string = '';
  statusOptions: string[] = ['pending', 'pending_admin_review', 'approved', 'rejected'];
  supplierOptions: string[] = [];

  constructor(private warehouseService: WarehouseService) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInventory(): void {
    this.isLoading = true;
    this.warehouseService
      .getRequisitionInventory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ Inventory items loaded:', data.length, 'items');
          this.allItems = data;
          
          // Show status breakdown
          const statusCount = new Map<string, number>();
          data.forEach((item) => {
            statusCount.set(item.requisition_status, (statusCount.get(item.requisition_status) || 0) + 1);
          });
          console.log('📊 Items by status:', Object.fromEntries(statusCount));
          
          this.populateSupplierOptions();
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error loading inventory:', err);
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load inventory items',
          });
        },
      });
  }

  populateSupplierOptions(): void {
    const suppliers = new Set<string>();
    this.allItems.forEach((item) => {
      if (item.supplier) {
        suppliers.add(item.supplier);
      }
    });
    this.supplierOptions = Array.from(suppliers).sort();
  }

  applyFilters(): void {
    console.log('📋 INVENTORY FILTER DEBUG:');
    console.log('├─ filterItemName:', this.filterItemName || '(empty)');
    console.log('├─ filterSupplier:', this.filterSupplier || '(empty)');
    console.log('├─ filterStatus:', this.filterStatus || '(empty)');
    console.log('├─ Total items:', this.allItems.length);

    // Show all unique statuses in data
    const uniqueStatuses = new Set(this.allItems.map((i) => i.requisition_status));
    console.log('├─ Available statuses:', Array.from(uniqueStatuses));

    this.filteredItems = this.allItems.filter((item) => {
      const matchItemName =
        !this.filterItemName ||
        item.item_name.toLowerCase().includes(this.filterItemName.toLowerCase());
      const matchSupplier =
        !this.filterSupplier || item.supplier === this.filterSupplier;
      const matchStatus =
        !this.filterStatus || item.requisition_status === this.filterStatus;

      // Date range filter
      let matchDateRange = true;
      if (this.filterStartDate || this.filterEndDate) {
        const itemDate = new Date(item.created_at);
        if (this.filterStartDate) {
          const startDate = new Date(this.filterStartDate);
          startDate.setHours(0, 0, 0, 0);
          matchDateRange = matchDateRange && itemDate >= startDate;
        }
        if (this.filterEndDate) {
          const endDate = new Date(this.filterEndDate);
          endDate.setHours(23, 59, 59, 999);
          matchDateRange = matchDateRange && itemDate <= endDate;
        }
      }

      return matchItemName && matchSupplier && matchStatus && matchDateRange;
    });

    console.log('└─ ✅ Filtered items:', this.filteredItems.length);
    this.dataSource.data = this.filteredItems;
    this.dataSource.paginator = this.paginator;
  }

  onFilterChange(): void {
    console.log('� Filter updated by user - applying filters...');
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterItemName = '';
    this.filterSupplier = '';
    this.filterStatus = '';
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.applyFilters();
  }

  getRequesterName(item: RequisitionInventoryItem): string {
    if (!item.requester) return 'N/A';
    const { first_name, last_name } = item.requester;
    return [first_name, last_name].filter(Boolean).join(' ');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'pending_admin_review':
        return 'info';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'pending_admin_review':
        return 'Awaiting Admin';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  }

  formatCurrency(value: number | string | undefined): string {
    if (!value) return '₱0.00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(numValue || 0);
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

  viewDetails(item: RequisitionInventoryItem): void {
    const unitCost = typeof item.unit_cost === 'string' 
      ? parseFloat(item.unit_cost) 
      : item.unit_cost;
    const totalCost = typeof item.total_cost === 'string' 
      ? parseFloat(item.total_cost) 
      : item.total_cost;

    Swal.fire({
      title: `Item: ${item.item_name}`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>RF Number:</strong> ${item.rf_number}</p>
          <p><strong>Quantity:</strong> ${item.quantity} ${item.unit}</p>
          <p><strong>Supplier:</strong> ${item.supplier || 'N/A'}</p>
          <p><strong>Unit Cost:</strong> ${this.formatCurrency(unitCost)}</p>
          <p><strong>Total Cost:</strong> ${this.formatCurrency(totalCost)}</p>
          <p><strong>Purpose/Remarks:</strong> ${item.purpose_remarks || 'N/A'}</p>
          <p><strong>Requester:</strong> ${this.getRequesterName(item)}</p>
          <p><strong>Request Type:</strong> ${item.requested_by_type?.toUpperCase() || 'N/A'}</p>
          <p><strong>Status:</strong> ${this.getStatusLabel(item.requisition_status)}</p>
          <p><strong>Requested:</strong> ${this.formatDate(item.created_at)}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close',
    });
  }

  calculateTotalInventory(): number {
    return this.filteredItems.reduce((total, item) => {
      const itemTotal = typeof item.total_cost === 'string' 
        ? parseFloat(item.total_cost) 
        : item.total_cost;
      return total + (itemTotal || 0);
    }, 0);
  }

  calculateTotalQuantity(): number {
    return this.filteredItems.reduce((total, item) => total + (item.quantity || 0), 0);
  }

  downloadData(): void {
    if (this.filteredItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'There are no items to download.',
      });
      return;
    }

    const startDate = this.filterStartDate 
      ? this.formatDateString(this.filterStartDate) 
      : 'All';
    const endDate = this.filterEndDate 
      ? this.formatDateString(this.filterEndDate) 
      : 'All';

    this.generateInventoryPDF(startDate, endDate);
  }

  private generateInventoryPDF(startDate: string, endDate: string): void {
    const headers = ['RF Number', 'Item Name', 'Quantity', 'Unit', 'Supplier', 'Unit Cost', 'Total Cost', 'Status', 'Requester', 'Date Created'];

    const tableData = [
      headers.map((h) => ({
        text: h,
        bold: true,
        color: '#ffffff',
        fillColor: '#1976d2',
        alignment: 'center',
        margin: [4, 6, 4, 6],
        fontSize: 9,
      })),
      ...this.filteredItems.map((item, index) => [
        {
          text: item.rf_number,
          margin: [4, 5, 4, 5],
          fontSize: 8,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: item.item_name,
          margin: [4, 5, 4, 5],
          fontSize: 8,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: item.quantity.toString(),
          margin: [4, 5, 4, 5],
          fontSize: 8,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: item.unit,
          margin: [4, 5, 4, 5],
          fontSize: 8,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: item.supplier || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 8,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: this.formatCurrency(item.unit_cost),
          margin: [4, 5, 4, 5],
          fontSize: 8,
          alignment: 'right',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: this.formatCurrency(item.total_cost),
          margin: [4, 5, 4, 5],
          fontSize: 8,
          alignment: 'right',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
          bold: true,
        },
        {
          text: this.getStatusLabel(item.requisition_status),
          margin: [4, 5, 4, 5],
          fontSize: 8,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: this.getRequesterName(item),
          margin: [4, 5, 4, 5],
          fontSize: 8,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: this.formatDate(item.created_at),
          margin: [4, 5, 4, 5],
          fontSize: 8,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
      ]),
    ];

    const docDefinition: any = {
      content: [
        {
          text: 'Requisition Inventory Report',
          style: 'header',
          alignment: 'center',
        },
        {
          text: `From: ${startDate}    To: ${endDate}`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', '*', 'auto', 'auto', 'auto', '*', 'auto'],
            body: tableData,
          },
          layout: 'lightHorizontalLines',
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 128, 0, 10],
                },
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 128, 0, 10],
                },
              ],
              [
                {
                  text: 'Signature',
                  alignment: 'center',
                  fontSize: 10,
                  margin: [0, 5, 0, 0],
                },
                {
                  text: 'Signature',
                  alignment: 'center',
                  fontSize: 10,
                  margin: [0, 5, 0, 0],
                },
              ],
            ],
          },
          layout: 'noBorders',
          margin: [0, 40, 0, 0],
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          italics: true,
        },
      },
      pageOrientation: 'landscape',
      pageMargins: [10, 10, 10, 10],
    };

    try {
      const pdfMake = (window as any).pdfMake;
      if (!pdfMake) {
        throw new Error('pdfMake library not initialized');
      }
      pdfMake.createPdf(docDefinition).download(`inventory-${startDate}-to-${endDate}.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
      Swal.fire({
        icon: 'error',
        title: 'PDF Error',
        text: 'Failed to generate PDF. Please try again.',
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'PDF Downloaded',
      text: `Inventory report downloaded successfully (${this.filteredItems.length} items)!`,
      timer: 2000,
      showConfirmButton: false,
    });
  }

  private formatDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
