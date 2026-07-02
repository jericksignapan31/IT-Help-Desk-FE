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
import { ReturnRequisitionDialogComponent } from '../return-requisition-dialog/return-requisition-dialog.component';
import { RequisitionDetailDialogComponent } from '../requisition-detail-dialog/requisition-detail-dialog.component';
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

  getDepartmentName(department: string | { department_id: string; department_name: string; description: string; is_active: boolean; created_at: string; updated_at: string; } | undefined): string {
    if (!department) return 'N/A';
    
    // If department is an object with department_name
    if (typeof department === 'object' && department.department_name) {
      return department.department_name;
    }
    
    // If department is a string (ID), look it up in the departments array
    if (typeof department === 'string') {
      const dept = this.departments.find((d) => d.department_id === department);
      return dept ? dept.department_name : department;
    }
    
    return 'N/A';
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
    const dialogRef = this.dialog.open(RequisitionDetailDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        requisition,
        departments: this.departments,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.action === 'acknowledge') {
          this.acknowledgeRequisition(requisition);
        } else if (result.action === 'returnFull') {
          this.openReturnDialog(requisition);
        } else if (result.action === 'returnItem') {
          this.openReturnItemDialog(result.item, result.rfNumber);
        }
      }
    });
  }

  openReturnDialog(requisition: PartRequisition): void {
    const dialogRef = this.dialog.open(ReturnRequisitionDialogComponent, {
      width: '500px',
      data: { rfNumber: requisition.rf_number },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPendingRequisitions();
      }
    });
  }

  openReturnItemDialog(item: any, rfNumber: string): void {
    const dialogRef = this.dialog.open(ReturnRequisitionDialogComponent, {
      width: '500px',
      data: { rfNumber, item },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPendingRequisitions();
      }
    });
  }
}
