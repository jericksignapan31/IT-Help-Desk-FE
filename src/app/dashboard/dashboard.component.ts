import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import { DashboardStats } from '../models/dashboard.model';
import { AuthService } from '../services/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    RouterModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityChartRef!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  loading = true;
  statusChart: Chart | null = null;
  priorityChart: Chart | null = null;
  isBrowser: boolean;

  displayedColumns: string[] = [
    'ticket_number',
    'title',
    'priority',
    'status',
    'created_at',
  ];

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Log current user information
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
    
    }
    this.loadDashboardStats();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        setTimeout(() => this.initializeCharts(), 100);
      },
      error: (err) => {
        this.loading = false;
        // Use mock data for development
        this.useMockData();
        setTimeout(() => this.initializeCharts(), 100);
      },
    });
  }

  useMockData(): void {
    this.stats = {
      totalTickets: 45,
      openTickets: 12,
      pendingRepairs: 5,
      assetsInUse: 89,
      ticketsByStatus: {
        open: 12,
        'in-progress': 8,
        resolved: 20,
        closed: 5,
      },
      ticketsByPriority: {
        low: 10,
        medium: 20,
        high: 12,
        urgent: 3,
      },
      assetsByCondition: {
        excellent: 30,
        good: 40,
        fair: 15,
        poor: 3,
        broken: 1,
      },
      recentTickets: [],
    };
  }

  initializeCharts(): void {
    // Only initialize charts in browser
    if (!this.isBrowser || !this.stats) return;

    // Destroy existing charts
    if (this.statusChart) {
      this.statusChart.destroy();
    }
    if (this.priorityChart) {
      this.priorityChart.destroy();
    }

    // Status Chart
    if (this.statusChartRef) {
      const statusCtx = this.statusChartRef.nativeElement.getContext('2d');
      if (statusCtx) {
        this.statusChart = new Chart(statusCtx, {
          type: 'doughnut',
          data: {
            labels: Object.keys(this.stats.ticketsByStatus).map((s) =>
              s.replace('-', ' ').toUpperCase(),
            ),
            datasets: [
              {
                data: Object.values(this.stats.ticketsByStatus),
                backgroundColor: ['#2196F3', '#FF9800', '#4CAF50', '#9E9E9E'],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
              },
            },
          },
        });
      }
    }

    // Priority Chart
    if (this.priorityChartRef) {
      const priorityCtx = this.priorityChartRef.nativeElement.getContext('2d');
      if (priorityCtx) {
        this.priorityChart = new Chart(priorityCtx, {
          type: 'bar',
          data: {
            labels: Object.keys(this.stats.ticketsByPriority).map((p) =>
              p.toUpperCase(),
            ),
            datasets: [
              {
                label: 'Tickets by Priority',
                data: Object.values(this.stats.ticketsByPriority),
                backgroundColor: ['#4CAF50', '#FF9800', '#F44336', '#D32F2F'],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                },
              },
            },
          },
        });
      }
    }
  }
}
