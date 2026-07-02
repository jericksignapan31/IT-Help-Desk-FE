import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { WarehouseService } from '../../services/warehouse.service';
import { DepartmentService } from '../../services/department.service';
import { PartRequisition } from '../../models/requisition.model';
import { Department } from '../../models/department.model';
import { RequisitionDetailDialogComponent } from '../requisition-detail-dialog/requisition-detail-dialog.component';
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
    MatPaginatorModule,
  ],
  templateUrl: './approved-requisitions.component.html',
  styleUrls: ['./approved-requisitions.component.scss'],
})
export class ApprovedRequisitionsComponent implements OnInit, OnDestroy, AfterViewInit {
  requisitions: PartRequisition[] = [];
  dataSource = new MatTableDataSource<PartRequisition>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
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
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  ngAfterViewInit(): void {
    // Set paginator connection FIRST
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    // THEN load data
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
          this.dataSource.data = data;
          this.isLoading = false;
          this.cdr.detectChanges();
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
    const dialogRef = this.dialog.open(RequisitionDetailDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        requisition,
        departments: this.departments,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action) {
        // Handle any actions if needed
        console.log('Dialog action:', result.action);
      }
    });
  }
}
