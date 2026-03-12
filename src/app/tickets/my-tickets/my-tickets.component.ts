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
    MatTooltipModule,
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

    console.log('🔄 [My Tickets] Loading my tickets...');
    console.log('👤 [My Tickets] Current user:', currentUser);
    console.log('🆔 [My Tickets] Employee ID:', currentUser?.employee_id);

    if (currentUser && currentUser.employee_id) {
      const employeeId = currentUser.employee_id; // Keep as is (string or number)

      console.log('📡 [My Tickets] Calling API with employee_id:', employeeId);

      this.ticketService.getMyTickets(employeeId).subscribe({
        next: (data) => {
          console.log('✅ [My Tickets] Tickets loaded successfully!');
          console.log('📦 [My Tickets] Total tickets:', data.length);
          console.log('📋 [My Tickets] Tickets data:', data);

          this.tickets = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ [My Tickets] Failed to load my tickets:', err);
          console.error('📊 [My Tickets] Error status:', err.status);
          console.error('💬 [My Tickets] Error details:', err.error);
          this.loading = false;
        },
      });
    } else {
      console.error('❌ [My Tickets] No employee ID found in current user');
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
