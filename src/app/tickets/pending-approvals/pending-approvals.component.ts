import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TicketService } from '../../services/ticket.service';
import { Ticket } from '../../models/ticket.model';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './pending-approvals.component.html',
  styleUrls: ['./pending-approvals.component.scss'],
})
export class PendingApprovalsComponent implements OnInit {
  tickets: Ticket[] = [];
  displayedColumns: string[] = [
    'ticket_id',
    'subject',
    'category',
    'priority',
    'status',
    'reporter',
    'created_at',
    'actions',
  ];
  loading = true;

  constructor(
    private ticketService: TicketService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  loadPendingApprovals(): void {
    this.loading = true;

    console.log('🔄 [Pending Approvals] Loading pending approval tickets...');

    this.ticketService.getPendingApprovals().subscribe({
      next: (data) => {
        console.log('✅ [Pending Approvals] Tickets loaded successfully!');
        console.log('📦 [Pending Approvals] Total tickets:', data.length);
        console.log('📋 [Pending Approvals] Tickets data:', data);

        this.tickets = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(
          '❌ [Pending Approvals] Failed to load pending approvals:',
          err,
        );
        console.error('📊 [Pending Approvals] Error status:', err.status);
        console.error('💬 [Pending Approvals] Error details:', err.error);
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Failed to Load',
          text: 'Unable to load pending approval tickets. Please try again.',
          confirmButtonColor: '#3f51b5',
        });
      },
    });
  }

  approveTicket(ticket: Ticket): void {
    Swal.fire({
      title: 'Approve Ticket',
      text: `Are you sure you want to approve ticket #${ticket.ticket_id}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#9e9e9e',
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ticketService.approveTicket(ticket.ticket_id!).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Approved!',
              text: 'The ticket has been approved.',
              confirmButtonColor: '#3f51b5',
            });
            this.loadPendingApprovals();
          },
          error: (err) => {
            console.error('Failed to approve ticket:', err);
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: 'Unable to approve ticket. Please try again.',
              confirmButtonColor: '#3f51b5',
            });
          },
        });
      }
    });
  }

  rejectTicket(ticket: Ticket): void {
    Swal.fire({
      title: 'Reject Ticket',
      text: `Are you sure you want to reject ticket #${ticket.ticket_id}?`,
      input: 'textarea',
      inputLabel: 'Reason for rejection (optional)',
      inputPlaceholder: 'Enter rejection reason...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#9e9e9e',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const reason = result.value || 'No reason provided';
        this.ticketService.rejectTicket(ticket.ticket_id!, reason).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Rejected!',
              text: 'The ticket has been rejected.',
              confirmButtonColor: '#3f51b5',
            });
            this.loadPendingApprovals();
          },
          error: (err) => {
            console.error('Failed to reject ticket:', err);
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: 'Unable to reject ticket. Please try again.',
              confirmButtonColor: '#3f51b5',
            });
          },
        });
      }
    });
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getStatusClass(status: string): string {
    return `status-${status.replace('_', '-')}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  viewTicket(ticket: Ticket): void {
    const statusColor = this.getStatusColorForModal(ticket.status);
    const priorityColor = this.getPriorityColorForModal(ticket.priority);

    const reporterName = ticket.reporter
      ? `${ticket.reporter.first_name} ${ticket.reporter.last_name}`
      : 'N/A';

    const assetInfo = ticket.asset
      ? `${ticket.asset.asset_tag} (${ticket.asset.category})`
      : 'N/A';

    Swal.fire({
      title: `Ticket #${ticket.ticket_id}`,
      html: `
        <div style="text-align: left; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          
          <!-- Header Section -->
          <div style="border-bottom: 2px solid #1976d2; padding-bottom: 1rem; margin-bottom: 1.5rem;">
            <h2 style="color: #212121; margin: 0; font-size: 1.5rem; font-weight: 600;">${ticket.subject}</h2>
          </div>
          
          <!-- Status & Priority -->
          <div style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem;">
            <span style="display: inline-flex; align-items: center; padding: 0.4rem 1rem; background: ${statusColor}; color: white; border-radius: 20px; font-size: 0.813rem; font-weight: 500; text-transform: capitalize;">
              ${ticket.status.replace('_', ' ')}
            </span>
            <span style="display: inline-flex; align-items: center; padding: 0.4rem 1rem; background: ${priorityColor}; color: white; border-radius: 20px; font-size: 0.813rem; font-weight: 500; text-transform: capitalize;">
              ${ticket.priority}
            </span>
          </div>

          <!-- Description -->
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #757575; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Description</label>
            <p style="color: #424242; line-height: 1.6; margin: 0; font-size: 0.938rem;">${ticket.description}</p>
          </div>

          <!-- Info Grid -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem 2rem; margin-bottom: 1.5rem; padding: 1.25rem; background: #fafafa; border-radius: 8px;">
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #757575; margin-bottom: 0.25rem;">CATEGORY</label>
              <span style="color: #212121; font-size: 0.938rem; text-transform: capitalize;">${ticket.category}</span>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #757575; margin-bottom: 0.25rem;">APPROVAL</label>
              <span style="color: #212121; font-size: 0.938rem; text-transform: capitalize;">${ticket.approval_status}</span>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #757575; margin-bottom: 0.25rem;">REPORTER</label>
              <span style="color: #212121; font-size: 0.938rem;">${reporterName}</span>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #757575; margin-bottom: 0.25rem;">ASSET</label>
              <span style="color: #212121; font-size: 0.938rem;">${assetInfo}</span>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #757575; margin-bottom: 0.25rem;">CREATED</label>
              <span style="color: #212121; font-size: 0.938rem;">${this.formatDate(ticket.created_at)}</span>
            </div>
          </div>

          ${
            ticket.image_url
              ? `
          <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e0e0e0;">
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #757575; margin-bottom: 0.75rem; letter-spacing: 0.5px;">Attachment</label>
            <img src="${ticket.image_url}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="Ticket attachment"/>
          </div>
          `
              : ''
          }
        </div>
      `,
      width: '650px',
      confirmButtonText: 'Close',
      confirmButtonColor: '#1976d2',
    });
  }

  getStatusColorForModal(status: string): string {
    const colors: { [key: string]: string } = {
      pending_approval: '#f57f17',
      approved: '#0277bd',
      assigned: '#1976d2',
      in_progress: '#f57c00',
      'in-progress': '#f57c00',
      resolved: '#388e3c',
      closed: '#616161',
      rejected: '#c62828',
      cancelled: '#d32f2f',
    };
    return colors[status] || '#757575';
  }

  getPriorityColorForModal(priority: string): string {
    const colors: { [key: string]: string } = {
      low: '#2e7d32',
      medium: '#e65100',
      high: '#c2185b',
      critical: '#c62828',
    };
    return colors[priority] || '#757575';
  }
}
