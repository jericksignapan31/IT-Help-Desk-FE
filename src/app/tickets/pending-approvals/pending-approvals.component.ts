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
}
