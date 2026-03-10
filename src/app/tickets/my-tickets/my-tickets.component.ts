import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TicketService } from '../../services/ticket.service';
import { Ticket } from '../../models/ticket.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './my-tickets.component.html',
  styleUrls: ['./my-tickets.component.scss'],
})
export class MyTicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  displayedColumns: string[] = [
    'ticket_id',
    'subject',
    'category',
    'priority',
    'status',
    'approval_status',
    'created_at',
    'actions',
  ];
  loading = true;

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadMyTickets();
  }

  loadMyTickets(): void {
    this.loading = true;
    const currentUser = this.authService.currentUserValue;

    if (currentUser && currentUser.employee_id) {
      const employeeId =
        typeof currentUser.employee_id === 'string'
          ? parseInt(currentUser.employee_id, 10)
          : currentUser.employee_id;

      this.ticketService.getMyTickets(employeeId).subscribe({
        next: (data) => {
          this.tickets = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load my tickets:', err);
          this.loading = false;
        },
      });
    } else {
      console.error('No employee ID found');
      this.loading = false;
    }
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getStatusClass(status: string): string {
    return `status-${status.replace('_', '-')}`;
  }

  getApprovalStatusClass(status: string): string {
    return `approval-${status}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
