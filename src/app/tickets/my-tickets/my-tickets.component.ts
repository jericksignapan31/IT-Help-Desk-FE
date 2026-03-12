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
      title: `<strong>Ticket Details</strong>`,
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
              <strong style="color: #666;">Approval:</strong><br/>
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
              <strong style="color: #666;">Started:</strong> ${this.formatDate(ticket.started_at)}
            </div>
          `
              : ''
          }

          ${
            ticket.resolved_at
              ? `
            <div style="margin-bottom: 0.75rem;">
              <strong style="color: #666;">Resolved:</strong> ${this.formatDate(ticket.resolved_at)}
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
