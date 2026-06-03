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
import { OperationalDashboardDto, DepartmentMetrics } from '../../models/operational-dashboard.model';

Chart.register(...registerables);

@Component({
  selector: 'app-operational-dashboard',
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
    <div class="operational-dashboard-container">
      <!-- Header -->
      <div class="header">
        <h1>Operational Dashboard</h1>
        <p>Ticket metrics by department</p>
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
              <div class="metric-value">{{ dashboardData?.total_tickets || 0 }}</div>
              <div class="metric-label">Total Tickets</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric">
              <div class="metric-value">{{ dashboardData?.total_open_tickets || 0 }}</div>
              <div class="metric-label">Open Tickets</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Charts Section -->
      <div class="charts-container">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Tickets by Department</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas #departmentChart></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Status Distribution</mat-card-title>
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

              <!-- Ticket Count Column -->
              <ng-container matColumnDef="ticket_count">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let element">
                  <mat-chip class="chip-total">{{ element.ticket_count }}</mat-chip>
                </td>
              </ng-container>

              <!-- Open Column -->
              <ng-container matColumnDef="open_count">
                <th mat-header-cell *matHeaderCellDef>Open</th>
                <td mat-cell *matCellDef="let element">
                  <mat-chip class="chip-open">{{ element.open_count }}</mat-chip>
                </td>
              </ng-container>

              <!-- In Progress Column -->
              <ng-container matColumnDef="in_progress_count">
                <th mat-header-cell *matHeaderCellDef>In Progress</th>
                <td mat-cell *matCellDef="let element">
                  <mat-chip class="chip-progress">{{ element.in_progress_count }}</mat-chip>
                </td>
              </ng-container>

              <!-- Resolved Column -->
              <ng-container matColumnDef="resolved_count">
                <th mat-header-cell *matHeaderCellDef>Resolved</th>
                <td mat-cell *matCellDef="let element">
                  <mat-chip class="chip-resolved">{{ element.resolved_count }}</mat-chip>
                </td>
              </ng-container>

              <!-- Closed Column -->
              <ng-container matColumnDef="closed_count">
                <th mat-header-cell *matHeaderCellDef>Closed</th>
                <td mat-cell *matCellDef="let element">
                  <mat-chip class="chip-closed">{{ element.closed_count }}</mat-chip>
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
    .operational-dashboard-container {
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
            color: #1976d2;
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

          &.chip-open {
            background-color: #fff3e0;
            color: #f57c00;
          }

          &.chip-progress {
            background-color: #f3e5f5;
            color: #7b1fa2;
          }

          &.chip-resolved {
            background-color: #e8f5e9;
            color: #388e3c;
          }

          &.chip-closed {
            background-color: #f5f5f5;
            color: #616161;
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
export class OperationalDashboardComponent implements OnInit {
  @ViewChild('departmentChart') departmentChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;

  dashboardData: OperationalDashboardDto | null = null;
  dataSource = new MatTableDataSource<DepartmentMetrics>();
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
  displayedColumns: string[] = ['department_name', 'ticket_count', 'open_count', 'in_progress_count', 'resolved_count', 'closed_count'];

  departmentChart: Chart | null = null;
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
    this.analyticsDashboardService.getOperationalDashboard(this.selectedMonth, this.selectedYear).subscribe({
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
        console.error('Failed to load operational dashboard:', err);
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
    const departmentsWithData = this.dashboardData.department_metrics.filter(m => m.ticket_count > 0);

    // Department Chart
    if (this.departmentChartRef && isPlatformBrowser(this.platformId)) {
      const departments = departmentsWithData.map(m => m.department_name);
      const tickets = departmentsWithData.map(m => m.ticket_count);

      if (this.departmentChart) {
        this.departmentChart.destroy();
      }

      try {
        this.departmentChart = new Chart(this.departmentChartRef.nativeElement, {
          type: 'bar',
          data: {
            labels: departments,
            datasets: [
              {
                label: 'Tickets',
                data: tickets,
                backgroundColor: '#1976d2',
                borderColor: '#1565c0',
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
                ticks: {
                  stepSize: 1,
                },
              },
            },
          },
        });
      } catch (error) {
        console.error('Error initializing department chart:', error);
      }
    }

    // Status Distribution Chart
    if (this.statusChartRef && isPlatformBrowser(this.platformId)) {
      const open = this.dashboardData.department_metrics.reduce((sum, m) => sum + m.open_count, 0);
      const inProgress = this.dashboardData.department_metrics.reduce((sum, m) => sum + m.in_progress_count, 0);
      const resolved = this.dashboardData.department_metrics.reduce((sum, m) => sum + m.resolved_count, 0);
      const closed = this.dashboardData.department_metrics.reduce((sum, m) => sum + m.closed_count, 0);

      if (this.statusChart) {
        this.statusChart.destroy();
      }

      try {
        this.statusChart = new Chart(this.statusChartRef.nativeElement, {
          type: 'doughnut',
          data: {
            labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
            datasets: [
              {
                data: [open, inProgress, resolved, closed],
                backgroundColor: ['#ff9800', '#9c27b0', '#4caf50', '#9e9e9e'],
                borderColor: ['#fff', '#fff', '#fff', '#fff'],
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
}
