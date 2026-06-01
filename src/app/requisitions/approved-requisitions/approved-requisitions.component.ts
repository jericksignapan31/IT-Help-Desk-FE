import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import { WarehouseService } from '../../services/warehouse.service';
import { DepartmentService } from '../../services/department.service';
import { PartRequisition } from '../../models/requisition.model';
import { Department } from '../../models/department.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-approved-requisitions',
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
  ],
  templateUrl: './approved-requisitions.component.html',
  styleUrls: ['./approved-requisitions.component.scss'],
})
export class ApprovedRequisitionsComponent implements OnInit, OnDestroy {
  requisitions: PartRequisition[] = [];
  departments: Department[] = [];
  displayedColumns: string[] = [
    'rf_number',
    'requester',
    'warehouse_acknowledger',
    'items_count',
    'total_cost',
    'approved_at',
    'actions',
  ];
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private warehouseService: WarehouseService,
    private departmentService: DepartmentService,
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
    this.loadApprovedRequisitions();
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

  loadApprovedRequisitions(): void {
    this.isLoading = true;
    this.warehouseService
      .getApprovedRequisitions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ Approved requisitions loaded:', data);
          this.requisitions = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error loading approved requisitions:', err);
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load approved requisitions',
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
    if (!requisition.acknowledger) return 'N/A';
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
          <p><strong>Approved:</strong> ${this.formatDate(requisition.approved_at || '')}</p>
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
}
