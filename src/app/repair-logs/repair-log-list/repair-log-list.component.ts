import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { RepairLogService } from '../../services/repair-log.service';
import { RepairLog } from '../../models/repair-log.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-repair-log-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatPaginatorModule,
    FormsModule,
  ],
  templateUrl: './repair-log-list.component.html',
  styleUrls: ['./repair-log-list.component.scss'],
})
export class RepairLogListComponent implements OnInit {
  repairLogs: RepairLog[] = [];
  dataSource = new MatTableDataSource<RepairLog>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  filteredLogs: RepairLog[] = [];
  displayedColumns: string[] = [
    'ticket_id',
    'subject',
    'asset',
    'employee',
    'requested_date',
    'approved_date',
    'started_date',
    'completed_date',
    'total_days',
    'status',
    'actions',
  ];
  isLoading = false;

  // Filters
  statusFilter: string = 'all';
  searchTerm: string = '';

  constructor(
    private repairLogService: RepairLogService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadRepairLogs();
  }

  loadRepairLogs(): void {
    this.isLoading = true;
    this.repairLogService.getRepairLogs().subscribe({
      next: (logs) => {
        this.repairLogs = logs;
        this.applyFilters();
        this.dataSource.paginator = this.paginator;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading repair logs:', error);
        this.snackBar.open('Failed to load repair logs', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  applyFilters(): void {
    this.filteredLogs = this.repairLogs.filter((log) => {
      const matchesStatus =
        this.statusFilter === 'all' || log.status === this.statusFilter;
      const matchesSearch =
        !this.searchTerm ||
        log.ticket_subject
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        log.employee_name
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        log.ticket_id.toString().includes(this.searchTerm);

      return matchesStatus && matchesSearch;
    });
    this.dataSource.data = this.filteredLogs;
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  viewTicketTimeline(log: RepairLog): void {
    const timelineHtml = `
      <div style="text-align: left; font-family: -apple-system, BlinkMac SystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="border-bottom: 2px solid #1976d2; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 1.25rem; color: #1976d2;">${log.ticket_subject}</h2>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 0.875rem;">Ticket #${log.ticket_id}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #fafafa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #666; margin-bottom: 4px;">Employee</label>
            <p style="margin: 0; color: #212121;">${log.employee_name}</p>
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #666; margin-bottom: 4px;">Department</label>
            <p style="margin: 0; color: #212121;">${log.department || 'N/A'}</p>
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #666; margin-bottom: 4px;">Asset</label>
            <p style="margin: 0; color: #212121;">${log.asset_name || log.asset_tag || 'N/A'}</p>
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #666; margin-bottom: 4px;">Assigned To</label>
            <p style="margin: 0; color: #212121;">${log.assigned_to || 'Not assigned'}</p>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 1rem; margin: 0 0 12px 0; color: #1976d2;">Timeline</h3>
          <div style="position: relative; padding-left: 24px;">
            <div style="position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: #e0e0e0;"></div>
            
            ${this.getTimelineItem('Requested', log.requested_date, '#2196f3', true)}
            ${log.approved_date ? this.getTimelineItem('Approved', log.approved_date, '#4caf50', true) : this.getTimelineItem('Approved', 'Pending', '#9e9e9e', false)}
            ${log.started_date ? this.getTimelineItem('Work Started', log.started_date, '#ff9800', true) : this.getTimelineItem('Work Started', 'Not started', '#9e9e9e', false)}
            ${log.completed_date ? this.getTimelineItem('Completed', log.completed_date, '#8bc34a', true) : this.getTimelineItem('Completed', 'In progress', '#9e9e9e', false)}
          </div>
          
          ${log.total_days ? `<p style="margin-top: 12px; padding: 8px 12px; background: #e3f2fd; border-radius: 4px; color: #1976d2; font-weight: 500;">Total Duration: ${log.total_days} day${log.total_days > 1 ? 's' : ''}</p>` : ''}
        </div>

        ${
          log.observation ||
          log.action_taken ||
          log.recommendation ||
          log.resolution_notes
            ? `
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
            <h3 style="font-size: 1rem; margin: 0 0 12px 0; color: #1976d2;">Work Details</h3>
            ${log.unit_status ? `<p style="margin: 8px 0;"><strong>Unit Status:</strong> ${log.unit_status}</p>` : ''}
            ${log.observation ? `<p style="margin: 8px 0; padding-left: 12px; border-left: 3px solid #1976d2;"><strong>Observation:</strong><br>${log.observation}</p>` : ''}
            ${log.action_taken ? `<p style="margin: 8px 0; padding-left: 12px; border-left: 3px solid #1976d2;"><strong>Action Taken:</strong><br>${log.action_taken}</p>` : ''}
            ${log.recommendation ? `<p style="margin: 8px 0; padding-left: 12px; border-left: 3px solid #1976d2;"><strong>Recommendation:</strong><br>${log.recommendation}</p>` : ''}
            ${log.resolution_notes ? `<p style="margin: 8px 0; padding-left: 12px; border-left: 3px solid #1976d2;"><strong>Notes:</strong><br>${log.resolution_notes}</p>` : ''}
          </div>
        `
            : ''
        }
      </div>
    `;

    Swal.fire({
      title: `Ticket Timeline - #${log.ticket_id}`,
      html: timelineHtml,
      width: '700px',
      confirmButtonText: 'Close',
      confirmButtonColor: '#1976d2',
    });
  }

  private getTimelineItem(
    label: string,
    date: string,
    color: string,
    completed: boolean,
  ): string {
    const formattedDate = completed
      ? new Date(date).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : date;

    return `
      <div style="position: relative; margin-bottom: 16px;">
        <div style="position: absolute; left: -20px; width: 12px; height: 12px; border-radius: 50%; background: ${color}; border: 2px solid white; box-shadow: 0 0 0 2px ${color};"></div>
        <div style="padding-left: 8px;">
          <p style="margin: 0; font-weight: 600; color: #212121; font-size: 0.875rem;">${label}</p>
          <p style="margin: 4px 0 0 0; color: ${completed ? '#666' : '#9e9e9e'}; font-size: 0.8125rem;">${formattedDate}</p>
        </div>
      </div>
    `;
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending_approval: 'status-pending',
      approved: 'status-approved',
      assigned: 'status-assigned',
      in_progress: 'status-in-progress',
      resolved: 'status-resolved',
      closed: 'status-closed',
      rejected: 'status-rejected',
      cancelled: 'status-cancelled',
    };
    return statusMap[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending_approval: 'Pending',
      approved: 'Approved',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
