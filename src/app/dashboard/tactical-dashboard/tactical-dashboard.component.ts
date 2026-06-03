import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { Chart, registerables } from 'chart.js';
import Swal from 'sweetalert2';
import { AnalyticsDashboardService } from '../../services/analytics-dashboard.service';
import { TacticalDashboardDto, TacticalDepartmentMetrics } from '../../models/tactical-dashboard.model';

Chart.register(...registerables);

@Component({
  selector: 'app-tactical-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatChipsModule,
  ],
  template: `
    <div class="tactical-dashboard-container">
      <!-- Header -->
      <div class="header">
        <h1>Tactical Dashboard</h1>
        <p>Requisition metrics and costing by department</p>
      </div>

      <!-- Filter Section -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>Month</mat-label>
              <mat-select [(ngModel)]="selectedMonth" (ngModelChange)="onFilterChange()">
                <mat-option *ngFor="let month of months" [value]="month.value">
                  {{ month.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Year</mat-label>
              <mat-select [(ngModel)]="selectedYear" (ngModelChange)="onFilterChange()">
                <mat-option *ngFor="let year of years" [value]="year">
                  {{ year }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="loadDashboard()">
              <mat-icon>refresh</mat-icon>
              Load
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Key Metrics -->
      <div class="metrics-container">
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric">
              <div class="metric-value">{{ dashboardData?.total_requisitions || 0 }}</div>
              <div class="metric-label">Total Requisitions</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric">
              <div class="metric-value">{{ formatCurrency(dashboardData?.total_costing || 0) }}</div>
              <div class="metric-label">Total Costing</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Charts Section -->
      <div class="charts-container">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Costing by Department</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas #costingChart></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Approval Status</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas #statusChart></canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Department Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Department Metrics</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div *ngIf="!loading && dashboardData" class="table-wrapper">
            <table mat-table [dataSource]="dataSource" class="metrics-table">
              <!-- Department Name Column -->
              <ng-container matColumnDef="department_name">
                <th mat-header-cell *matHeaderCellDef>Department</th>
                <td mat-cell *matCellDef="let element">
                  <strong>{{ element.department_name }}</strong>
                </td>
              </ng-container>

              <!-- Requisition Count Column -->
              <ng-container matColumnDef="requisition_count">
                <th mat-header-cell *matHeaderCellDef>Requisitions</th>
                <td mat-cell *matCellDef="let element">
                  <mat-chip class="chip-total">{{ element.requisition_count }}</mat-chip>
                </td>
              </ng-container>

              <!-- Approved Column -->
              <ng-container matColumnDef="approved_count">
                <th mat-header-cell *matHeaderCellDef>Approved</th>
                <td mat-cell *matCellDef="let element">
                  <mat-chip class="chip-approved">{{ element.approved_count }}</mat-chip>
                </td>
              </ng-container>

              <!-- Pending Column -->
              <ng-container matColumnDef="pending_count">
                <th mat-header-cell *matHeaderCellDef>Pending</th>
                <td mat-cell *matCellDef="let element">
                  <mat-chip class="chip-pending">{{ element.pending_count }}</mat-chip>
                </td>
              </ng-container>

              <!-- Total Costing Column -->
              <ng-container matColumnDef="total_costing">
                <th mat-header-cell *matHeaderCellDef>Total Cost</th>
                <td mat-cell *matCellDef="let element">
                  <strong>{{ formatCurrency(element.total_costing) }}</strong>
                </td>
              </ng-container>

              <!-- Average Costing Column -->
              <ng-container matColumnDef="average_costing">
                <th mat-header-cell *matHeaderCellDef>Avg Cost</th>
                <td mat-cell *matCellDef="let element">
                  {{ formatCurrency(element.average_costing) }}
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </div>

          <div *ngIf="!loading && !dashboardData" class="empty-state">
            <mat-icon>info</mat-icon>
            <p>No data available</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .tactical-dashboard-container {
      padding: 24px;
      background: #f5f5f5;
      min-height: 100vh;
    }

    .header {
      margin-bottom: 24px;

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }

      p {
        margin: 8px 0 0 0;
        color: #666;
      }
    }

    .filters-card {
      margin-bottom: 24px;

      .filters {
        display: flex;
        gap: 16px;
        align-items: flex-end;
        flex-wrap: wrap;

        mat-form-field {
          min-width: 150px;
        }
      }
    }

    .metrics-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;

      .metric-card {
        .metric {
          text-align: center;

          .metric-value {
            font-size: 32px;
            font-weight: 600;
            color: #ff6b6b;
          }

          .metric-label {
            margin-top: 8px;
            color: #666;
            font-size: 14px;
          }
        }
      }
    }

    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 16px;
      margin-bottom: 24px;

      .chart-card {
        min-height: 400px;
      }
    }

    .table-card {
      .table-wrapper {
        overflow-x: auto;
      }

      .metrics-table {
        width: 100%;

        mat-chip {
          font-size: 12px;
          min-height: 24px;

          &.chip-total {
            background-color: #e3f2fd;
            color: #1976d2;
          }

          &.chip-approved {
            background-color: #e8f5e9;
            color: #388e3c;
          }

          &.chip-pending {
            background-color: #fff3e0;
            color: #f57c00;
          }
        }
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #bbb;
      }
    }
  `]
})
export class TacticalDashboardComponent implements OnInit {
  @ViewChild('costingChart') costingChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;

  dashboardData: TacticalDashboardDto | null = null;
  dataSource = new MatTableDataSource<TacticalDepartmentMetrics>();
  loading = false;

  selectedMonth: number;
  selectedYear: number;
  months = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 },
  ];

  years: number[] = [];
  displayedColumns: string[] = ['department_name', 'requisition_count', 'approved_count', 'pending_count', 'total_costing', 'average_costing'];

  costingChart: Chart | null = null;
  statusChart: Chart | null = null;

  constructor(
    private analyticsDashboardService: AnalyticsDashboardService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    this.initializeYears();
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      this.years.push(i);
    }
  }

  onFilterChange(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.analyticsDashboardService.getTacticalDashboard(this.selectedMonth, this.selectedYear).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.dataSource.data = data.department_metrics;
        this.loading = false;

        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            this.initCharts();
          }, 100);
        }
      },
      error: (err) => {
        console.error('Failed to load tactical dashboard:', err);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load dashboard data',
        });
      },
    });
  }

  private initCharts(): void {
    if (!this.dashboardData) return;

    // Filter departments with data (exclude zero-value departments)
    const departmentsWithData = this.dashboardData.department_metrics.filter(m => m.requisition_count > 0);

    // Costing Chart
    if (this.costingChartRef && isPlatformBrowser(this.platformId)) {
      const departments = departmentsWithData.map(m => m.department_name);
      const costing = departmentsWithData.map(m => m.total_costing);

      if (this.costingChart) {
        this.costingChart.destroy();
      }

      try {
        this.costingChart = new Chart(this.costingChartRef.nativeElement, {
          type: 'bar',
          data: {
            labels: departments,
            datasets: [
              {
                label: 'Total Costing (PHP)',
                data: costing,
                backgroundColor: '#ff6b6b',
                borderColor: '#ee5a52',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: true,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      } catch (error) {
        console.error('Error initializing costing chart:', error);
      }
    }

    // Approval Status Chart
    if (this.statusChartRef && isPlatformBrowser(this.platformId)) {
      const approved = this.dashboardData.department_metrics.reduce((sum, m) => sum + m.approved_count, 0);
      const pending = this.dashboardData.department_metrics.reduce((sum, m) => sum + m.pending_count, 0);

      if (this.statusChart) {
        this.statusChart.destroy();
      }

      try {
        this.statusChart = new Chart(this.statusChartRef.nativeElement, {
          type: 'doughnut',
          data: {
            labels: ['Approved', 'Pending'],
            datasets: [
              {
                data: [approved, pending],
                backgroundColor: ['#4caf50', '#ff9800'],
                borderColor: ['#fff', '#fff'],
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
              },
            },
          },
        });
      } catch (error) {
        console.error('Error initializing status chart:', error);
      }
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  }
}
