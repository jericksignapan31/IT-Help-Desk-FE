import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;

    let request: Observable<Ticket[]>;

    if (this.viewMode === 'pending-approvals') {
      request = this.ticketService.getPendingApprovals();
    } else if (this.filters.search) {
      // Use search endpoint if search query exists
      request = this.ticketService.searchTickets(this.filters.search);
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
        this.tickets = data;
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
}
