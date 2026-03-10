import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { TicketService } from '../../services/ticket.service';
import { Ticket, TicketStatus } from '../../models/ticket.model';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-assigned-tickets',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
  templateUrl: './assigned-tickets.component.html',
  styleUrls: ['./assigned-tickets.component.scss'],
})
export class AssignedTicketsComponent implements OnInit {
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
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadAssignedTickets();
  }

  loadAssignedTickets(): void {
    this.loading = true;
    const currentUser = this.authService.currentUserValue;

    if (currentUser && currentUser.employee_id) {
      const employeeId =
        typeof currentUser.employee_id === 'string'
          ? parseInt(currentUser.employee_id, 10)
          : currentUser.employee_id;

      this.ticketService.getAssignedToMe(employeeId).subscribe({
        next: (data) => {
          this.tickets = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load assigned tickets:', err);
          this.loading = false;
        },
      });
    } else {
      console.error('No employee ID found');
      this.loading = false;
    }
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
        this.ticketService
          .updateTicketStatus(ticket.ticket_id, TicketStatus.IN_PROGRESS)
          .subscribe({
            next: () => {
              Swal.fire(
                'Started!',
                'Ticket status updated to In Progress',
                'success',
              );
              this.loadAssignedTickets();
            },
            error: (err) => {
              console.error('Failed to update ticket:', err);
              Swal.fire('Error', 'Failed to update ticket status', 'error');
            },
          });
      }
    });
  }

  resolveTicket(ticket: Ticket): void {
    Swal.fire({
      title: 'Resolve Ticket',
      text: 'Please provide resolution notes:',
      input: 'textarea',
      inputPlaceholder: 'Describe what was fixed...',
      showCancelButton: true,
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#9e9e9e',
      confirmButtonText: 'Mark as Resolved',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'Resolution notes are required!';
        }
        return null;
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.ticketService
          .updateTicketStatus(
            ticket.ticket_id,
            TicketStatus.RESOLVED,
            result.value,
          )
          .subscribe({
            next: () => {
              Swal.fire('Resolved!', 'Ticket has been resolved', 'success');
              this.loadAssignedTickets();
            },
            error: (err) => {
              console.error('Failed to resolve ticket:', err);
              Swal.fire('Error', 'Failed to resolve ticket', 'error');
            },
          });
      }
    });
  }

  canStartWork(ticket: Ticket): boolean {
    return ticket.status === TicketStatus.ASSIGNED;
  }

  canResolve(ticket: Ticket): boolean {
    return (
      ticket.status === TicketStatus.IN_PROGRESS ||
      ticket.status === TicketStatus.ASSIGNED
    );
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
