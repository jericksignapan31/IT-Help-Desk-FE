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
import {
  Ticket,
  TicketStatus,
  TicketCompletionData,
} from '../../models/ticket.model';
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
          console.log('✅ [Assigned Tickets] Loaded tickets:', data);
          console.log(
            '✅ [Assigned Tickets] Ticket statuses:',
            data.map((t) => ({ id: t.ticket_id, status: t.status })),
          );
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
        this.ticketService.startWork(ticket.ticket_id).subscribe({
          next: () => {
            Swal.fire(
              'Started!',
              'Ticket status updated to In Progress',
              'success',
            );
            this.loadAssignedTickets();
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
            Swal.fire('Error', errorMessage, 'error');
          },
        });
      }
    });
  }

  resolveTicket(ticket: Ticket): void {
    Swal.fire({
      title: 'Complete Ticket',
      html: `
        <div class="swal-form" style="text-align: left;">
          <div class="form-group">
            <label for="unit_status" style="display: block; font-weight: 500; margin-bottom: 5px;">Unit Status *</label>
            <select id="unit_status" class="swal2-input" style="width: 100%; box-sizing: border-box;">
              <option value="">Select status...</option>
              <option value="working">Working</option>
              <option value="not_working">Not Working</option>
              <option value="needs_replacement">Needs Replacement</option>
            </select>
          </div>
          <div class="form-group" style="margin-top: 10px;">
            <label for="observation" style="display: block; font-weight: 500; margin-bottom: 5px;">Observation *</label>
            <textarea id="observation" class="swal2-textarea" placeholder="What did you find?" style="width: 100%; box-sizing: border-box;"></textarea>
          </div>
          <div class="form-group" style="margin-top: 10px;">
            <label for="action_taken" style="display: block; font-weight: 500; margin-bottom: 5px;">Action Taken *</label>
            <textarea id="action_taken" class="swal2-textarea" placeholder="What did you do?" style="width: 100%; box-sizing: border-box;"></textarea>
          </div>
          <div class="form-group" style="margin-top: 10px;">
            <label for="recommendation" style="display: block; font-weight: 500; margin-bottom: 5px;">Recommendation *</label>
            <textarea id="recommendation" class="swal2-textarea" placeholder="What should be done next?" style="width: 100%; box-sizing: border-box;"></textarea>
          </div>
          <div class="form-group" style="margin-top: 10px;">
            <label for="resolution_notes" style="display: block; font-weight: 500; margin-bottom: 5px;">Additional Notes (optional)</label>
            <textarea id="resolution_notes" class="swal2-textarea" placeholder="Any additional information..." style="width: 100%; box-sizing: border-box;"></textarea>
          </div>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#9e9e9e',
      confirmButtonText: 'Complete Ticket',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const unit_status = (
          document.getElementById('unit_status') as HTMLSelectElement
        ).value;
        const observation = (
          document.getElementById('observation') as HTMLTextAreaElement
        ).value;
        const action_taken = (
          document.getElementById('action_taken') as HTMLTextAreaElement
        ).value;
        const recommendation = (
          document.getElementById('recommendation') as HTMLTextAreaElement
        ).value;
        const resolution_notes = (
          document.getElementById('resolution_notes') as HTMLTextAreaElement
        ).value;

        if (!unit_status || !observation || !action_taken || !recommendation) {
          Swal.showValidationMessage('Please fill in all required fields');
          return false;
        }

        const completionData: any = {
          unit_status,
          observation,
          action_taken,
          recommendation,
        };

        if (resolution_notes) {
          completionData.resolution_notes = resolution_notes;
        }

        return completionData;
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.ticketService
          .completeTicket(ticket.ticket_id, result.value)
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Completed!',
                text: 'Ticket has been marked as resolved',
                timer: 2000,
              });
              this.loadAssignedTickets();
            },
            error: (err) => {
              console.error('Failed to complete ticket:', err);
              Swal.fire('Error', 'Failed to complete ticket', 'error');
            },
          });
      }
    });
  }

  canStartWork(ticket: Ticket): boolean {
    console.log(
      '🔍 [canStartWork] Checking ticket:',
      ticket.ticket_id,
      'Status:',
      ticket.status,
    );
    // Can start work if ticket is assigned OR approved (just assigned by supervisor)
    return (
      ticket.status === TicketStatus.ASSIGNED ||
      ticket.status === TicketStatus.APPROVED
    );
  }

  canResolve(ticket: Ticket): boolean {
    console.log(
      '🔍 [canResolve] Checking ticket:',
      ticket.ticket_id,
      'Status:',
      ticket.status,
    );
    return (
      ticket.status === TicketStatus.IN_PROGRESS ||
      ticket.status === TicketStatus.ASSIGNED ||
      ticket.status === TicketStatus.APPROVED
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
