import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  ApprovalStatus,
} from '../../models/ticket.model';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatTooltipModule,
    FormsModule,
  ],
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss'],
})
export class TicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  displayedColumns: string[] = [
    'ticket_id',
    'subject',
    'category',
    'priority',
    'status',
    'approval_status',
    'reporter',
    'created_at',
    'actions',
  ];
  loading = true;
  viewMode: 'all' | 'pending-approvals' = 'all';
  statusFilter: string | null = null;

  filters = {
    search: '',
    status: '',
    priority: '',
  };

  statusOptions = Object.values(TicketStatus);
  priorityOptions = Object.values(TicketPriority);

  constructor(
    private ticketService: TicketService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.statusFilter = data['statusFilter'] || null;
      if (this.statusFilter) {
        this.filters.status = this.statusFilter;
      }
      this.loadTickets();
    });
  }

  loadTickets(): void {
    this.loading = true;

    let request: Observable<Ticket[]>;

    if (this.viewMode === 'pending-approvals') {
      request = this.ticketService.getPendingApprovals();
    } else if (this.filters.search) {
      // Use search endpoint if search query exists
      request = this.ticketService.searchTickets(this.filters.search);
    } else if (this.statusFilter === 'completed') {
      // Special case: completed means resolved OR closed
      request = this.ticketService.getTickets(this.filters);
    } else if (this.filters.status && !this.filters.priority) {
      // Use status filter endpoint
      request = this.ticketService.getTicketsByStatus(this.filters.status);
    } else if (this.filters.priority && !this.filters.status) {
      // Use priority filter endpoint
      request = this.ticketService.getTicketsByPriority(this.filters.priority);
    } else {
      // Use general getTickets with params for combined filters
      request = this.ticketService.getTickets(this.filters);
    }

    request.subscribe({
      next: (data: Ticket[]) => {
        console.log('Loaded tickets:', data);
        console.log('Status filter:', this.statusFilter);
        console.log('Filters:', this.filters);
        // Filter for completed tickets (resolved OR closed)
        if (this.statusFilter === 'completed') {
          this.tickets = data.filter(
            (t) => t.status === 'resolved' || t.status === 'closed',
          );
        } else {
          this.tickets = data;
        }
        console.log('Final tickets after filter:', this.tickets);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load tickets:', err);
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.loadTickets();
  }

  clearFilters(): void {
    this.filters = { search: '', status: '', priority: '' };
    this.loadTickets();
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

  switchView(mode: 'all' | 'pending-approvals'): void {
    this.viewMode = mode;
    this.loadTickets();
  }

  getApprovalStatusClass(status: string): string {
    return `approval-${status}`;
  }

  approveTicket(ticket: Ticket): void {
    Swal.fire({
      title: 'Approve Ticket',
      text: `Approve ticket #${ticket.ticket_id}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ticketService.approveTicket(ticket.ticket_id).subscribe({
          next: (updatedTicket) => {
            Swal.fire({
              icon: 'success',
              title: 'Approved!',
              text: 'Ticket has been approved.',
              timer: 2000,
            });
            this.loadTickets();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to approve ticket.',
            });
            console.error('Failed to approve ticket:', err);
          },
        });
      }
    });
  }

  rejectTicket(ticket: Ticket): void {
    Swal.fire({
      title: 'Reject Ticket',
      text: 'Please provide a reason for rejection:',
      input: 'textarea',
      inputPlaceholder: 'Enter rejection reason...',
      inputValidator: (value) => {
        if (!value) {
          return 'Rejection reason is required!';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Reject',
      confirmButtonColor: '#d33',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.ticketService
          .rejectTicket(ticket.ticket_id, result.value)
          .subscribe({
            next: (updatedTicket) => {
              Swal.fire({
                icon: 'success',
                title: 'Rejected',
                text: 'Ticket has been rejected.',
                timer: 2000,
              });
              this.loadTickets();
            },
            error: (err) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to reject ticket.',
              });
              console.error('Failed to reject ticket:', err);
            },
          });
      }
    });
  }

  canApproveReject(ticket: Ticket): boolean {
    return (
      (this.authService.isSupervisor() || this.authService.isAdmin()) &&
      ticket.approval_status === 'pending' &&
      ticket.status === 'pending_approval'
    );
  }

  canStartWork(ticket: Ticket): boolean {
    // IT staff can start work on approved or assigned tickets
    return (
      this.authService.isTechnician() &&
      (ticket.status === TicketStatus.APPROVED ||
        ticket.status === TicketStatus.ASSIGNED)
    );
  }

  startWork(ticket: Ticket): void {
    Swal.fire({
      title: 'Start Working?',
      text: `Do you want to start working on ticket #${ticket.ticket_id}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3f51b5',
      cancelButtonColor: '#9e9e9e',
      confirmButtonText: 'Yes, start work',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ticketService.startWork(ticket.ticket_id).subscribe({
          next: (updatedTicket) => {
            console.log('Ticket after start work:', updatedTicket);
            console.log('Status:', updatedTicket.status);
            Swal.fire({
              icon: 'success',
              title: 'Started!',
              text: 'Ticket status updated to In Progress',
              timer: 2000,
            });
            this.loadTickets();
          },
          error: (err) => {
            console.error('Failed to start work:', err);
            console.error('Error details:', {
              status: err.status,
              message: err.error?.message,
              error: err.error,
            });
            const errorMessage =
              err.error?.message ||
              err.message ||
              'Failed to start work on ticket';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            });
          },
        });
      }
    });
  }

  viewTicket(ticket: Ticket): void {
    console.log('📋 [View Ticket] Full ticket object:', ticket);

    const statusColor = this.getStatusColorForModal(ticket.status);
    const priorityColor = this.getPriorityColorForModal(ticket.priority);

    const reporterName = ticket.reporter
      ? `${ticket.reporter.first_name} ${ticket.reporter.last_name}`
      : 'N/A';

    const assetInfo = ticket.asset
      ? `${ticket.asset.asset_tag} (${ticket.asset.category})`
      : 'N/A';

    Swal.fire({
      title: `<strong>Ticket #${ticket.ticket_id}</strong>`,
      html: `
        <div style="text-align: left; padding: 1rem;">
          <h3 style="color: #1976d2; margin-bottom: 1rem;">${ticket.subject}</h3>
          
          <div style="margin-bottom: 1.5rem;">
            <h4 style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">DESCRIPTION</h4>
            <p style="background: #f5f5f5; padding: 0.75rem; border-radius: 4px; margin: 0;">${ticket.description}</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <strong style="color: #666;">Status:</strong><br/>
              <span style="display: inline-block; padding: 0.25rem 0.75rem; background: ${statusColor}; color: white; border-radius: 12px; font-size: 0.85rem; margin-top: 0.25rem;">
                ${ticket.status}
              </span>
            </div>
            <div>
              <strong style="color: #666;">Priority:</strong><br/>
              <span style="display: inline-block; padding: 0.25rem 0.75rem; background: ${priorityColor}; color: white; border-radius: 12px; font-size: 0.85rem; margin-top: 0.25rem;">
                ${ticket.priority}
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <strong style="color: #666;">Category:</strong><br/>
              <span>${ticket.category}</span>
            </div>
            <div>
              <strong style="color: #666;">Approval Status:</strong><br/>
              <span>${ticket.approval_status}</span>
            </div>
          </div>

          <hr style="margin: 1rem 0; border: none; border-top: 1px solid #e0e0e0;"/>

          <div style="margin-bottom: 0.75rem;">
            <strong style="color: #666;">Reporter:</strong> ${reporterName}
          </div>
          <div style="margin-bottom: 0.75rem;">
            <strong style="color: #666;">Asset:</strong> ${assetInfo}
          </div>
          <div style="margin-bottom: 0.75rem;">
            <strong style="color: #666;">Created:</strong> ${this.formatDate(ticket.created_at)}
          </div>

          ${
            ticket.started_at
              ? `
            <div style="margin-bottom: 0.75rem;">
              <strong style="color: #666;">Started At:</strong> ${this.formatDate(ticket.started_at)}
            </div>
          `
              : ''
          }

          ${
            ticket.resolved_at
              ? `
            <div style="margin-bottom: 0.75rem;">
              <strong style="color: #666;">Resolved At:</strong> ${this.formatDate(ticket.resolved_at)}
            </div>
          `
              : ''
          }

          ${
            ticket.observation
              ? `
            <hr style="margin: 1rem 0; border: none; border-top: 1px solid #e0e0e0;"/>
            <div style="margin-bottom: 0.75rem;">
              <strong style="color: #666;">Observation:</strong><br/>
              <p style="background: #f5f5f5; padding: 0.75rem; border-radius: 4px; margin-top: 0.25rem;">${ticket.observation}</p>
            </div>
          `
              : ''
          }

          ${
            ticket.action_taken
              ? `
            <div style="margin-bottom: 0.75rem;">
              <strong style="color: #666;">Action Taken:</strong><br/>
              <p style="background: #f5f5f5; padding: 0.75rem; border-radius: 4px; margin-top: 0.25rem;">${ticket.action_taken}</p>
            </div>
          `
              : ''
          }

          ${
            ticket.recommendation
              ? `
            <div style="margin-bottom: 0.75rem;">
              <strong style="color: #666;">Recommendation:</strong><br/>
              <p style="background: #f5f5f5; padding: 0.75rem; border-radius: 4px; margin-top: 0.25rem;">${ticket.recommendation}</p>
            </div>
          `
              : ''
          }

          ${
            ticket.resolution_notes
              ? `
            <div style="margin-bottom: 0.75rem;">
              <strong style="color: #666;">Resolution Notes:</strong><br/>
              <p style="background: #f5f5f5; padding: 0.75rem; border-radius: 4px; margin-top: 0.25rem;">${ticket.resolution_notes}</p>
            </div>
          `
              : ''
          }

          ${
            ticket.rejection_reason
              ? `
            <hr style="margin: 1rem 0; border: none; border-top: 1px solid #e0e0e0;"/>
            <div style="margin-bottom: 0.75rem;">
              <strong style="color: #d32f2f;">Rejection Reason:</strong><br/>
              <p style="background: #ffebee; padding: 0.75rem; border-radius: 4px; margin-top: 0.25rem; color: #c62828;">${ticket.rejection_reason}</p>
            </div>
          `
              : ''
          }

          ${
            ticket.image_url
              ? `
            <hr style="margin: 1rem 0; border: none; border-top: 1px solid #e0e0e0;"/>
            <div style="margin-bottom: 0.75rem;">
              <strong style="color: #666;">Attachment:</strong><br/>
              <img src="${ticket.image_url}" style="max-width: 100%; border-radius: 4px; margin-top: 0.5rem;" alt="Ticket attachment"/>
            </div>
          `
              : ''
          }
        </div>
      `,
      width: '700px',
      showDenyButton: this.canStartWork(ticket),
      denyButtonText: 'Start Working',
      denyButtonColor: '#ff4081',
      confirmButtonText: 'Close',
      confirmButtonColor: '#1976d2',
    }).then((result) => {
      if (result.isDenied) {
        this.startWork(ticket);
      }
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
