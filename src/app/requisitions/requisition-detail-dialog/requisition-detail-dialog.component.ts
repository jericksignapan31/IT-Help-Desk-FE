import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { PartRequisition, RequisitionItem } from '../../models/requisition.model';
import { Department } from '../../models/department.model';

@Component({
  selector: 'app-requisition-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './requisition-detail-dialog.component.html',
  styleUrls: ['./requisition-detail-dialog.component.scss'],
})
export class RequisitionDetailDialogComponent {
  displayedColumns: string[] = ['item_name', 'quantity', 'unit', 'unit_cost', 'total_cost', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<RequisitionDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      requisition: PartRequisition;
      departments: Department[];
    }
  ) {}

  getDepartmentName(department: string | { department_id: string; department_name: string; description: string; is_active: boolean; created_at: string; updated_at: string; } | undefined): string {
    if (!department) return 'N/A';
    
    // If department is an object with department_name
    if (typeof department === 'object' && department.department_name) {
      return department.department_name;
    }
    
    // If department is a string (ID), look it up in the departments array
    if (typeof department === 'string') {
      const dept = this.data.departments.find((d) => d.department_id === department);
      return dept ? dept.department_name : department;
    }
    
    return 'N/A';
  }

  formatCurrency(value: number | string | undefined): string {
    const amount = typeof value === 'string' ? parseFloat(value) : value || 0;
    return `₱${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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

  calculateTotalCost(): number {
    if (!this.data.requisition.items || this.data.requisition.items.length === 0) {
      return 0;
    }
    return this.data.requisition.items.reduce((sum, item) => {
      const cost =
        typeof item.total_cost === 'string'
          ? parseFloat(item.total_cost)
          : item.total_cost || 0;
      return sum + cost;
    }, 0);
  }

  onReturnItem(item: RequisitionItem): void {
    this.dialogRef.close({
      action: 'returnItem',
      item,
      rfNumber: this.data.requisition.rf_number,
    });
  }

  onReturnFullRequisition(): void {
    this.dialogRef.close({
      action: 'returnFull',
      rfNumber: this.data.requisition.rf_number,
    });
  }

  onAcknowledge(): void {
    this.dialogRef.close({
      action: 'acknowledge',
      rfNumber: this.data.requisition.rf_number,
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
