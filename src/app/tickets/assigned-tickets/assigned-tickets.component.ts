import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
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
    MatPaginatorModule,
  ],
  templateUrl: './assigned-tickets.component.html',
  styleUrls: ['./assigned-tickets.component.scss'],
})
export class AssignedTicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  dataSource = new MatTableDataSource<Ticket>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
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
          this.dataSource.data = data;
          this.dataSource.paginator = this.paginator;
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
        <div style="text-align: left; max-width: 100%; overflow-x: hidden;">
          <div style="margin-bottom: 12px;">
            <label for="unit_status" style="display: block; font-weight: 500; font-size: 0.875rem; color: #424242; margin-bottom: 6px;">Unit Status *</label>
            <select id="unit_status" class="swal2-input" style="width: 100%; padding: 8px 12px; box-sizing: border-box; height: 38px; margin: 0;">
              <option value="">Select status...</option>
              <option value="working">Working</option>
              <option value="not_working">Not Working</option>
              <option value="needs_replacement">Needs Replacement</option>
            </select>
          </div>
          <div style="margin-bottom: 12px;">
            <label for="observation" style="display: block; font-weight: 500; font-size: 0.875rem; color: #424242; margin-bottom: 6px;">Observation *</label>
            <textarea id="observation" class="swal2-textarea" placeholder="What did you find?" style="width: 100%; box-sizing: border-box; height: 70px; padding: 8px 12px; margin: 0; resize: vertical;"></textarea>
          </div>
          <div style="margin-bottom: 12px;">
            <label for="action_taken" style="display: block; font-weight: 500; font-size: 0.875rem; color: #424242; margin-bottom: 6px;">Action Taken *</label>
            <textarea id="action_taken" class="swal2-textarea" placeholder="What did you do?" style="width: 100%; box-sizing: border-box; height: 70px; padding: 8px 12px; margin: 0; resize: vertical;"></textarea>
          </div>
          <div style="margin-bottom: 12px;">
            <label for="recommendation" style="display: block; font-weight: 500; font-size: 0.875rem; color: #424242; margin-bottom: 6px;">Recommendation *</label>
            <textarea id="recommendation" class="swal2-textarea" placeholder="What should be done next?" style="width: 100%; box-sizing: border-box; height: 70px; padding: 8px 12px; margin: 0; resize: vertical;"></textarea>
          </div>
          <div style="margin-bottom: 12px;">
            <label for="resolution_notes" style="display: block; font-weight: 500; font-size: 0.875rem; color: #424242; margin-bottom: 6px;">Additional Notes (optional)</label>
            <textarea id="resolution_notes" class="swal2-textarea" placeholder="Any additional information..." style="width: 100%; box-sizing: border-box; height: 70px; padding: 8px 12px; margin: 0; resize: vertical;"></textarea>
          </div>
        </div>
      `,
      width: '550px',
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

            ${
              ticket.started_at
                ? `
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #757575; margin-bottom: 0.25rem;">STARTED</label>
              <span style="color: #212121; font-size: 0.938rem;">${this.formatDate(ticket.started_at)}</span>
            </div>
            `
                : ''
            }
            ${
              ticket.resolved_at
                ? `
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 600; color: #757575; margin-bottom: 0.25rem;">RESOLVED</label>
              <span style="color: #212121; font-size: 0.938rem;">${this.formatDate(ticket.resolved_at)}</span>
            </div>
            `
                : ''
            }
          </div>

          ${
            ticket.observation || ticket.action_taken || ticket.recommendation
              ? `
          <!-- Work Details -->
          <div style="margin-bottom: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e0e0e0;">
            <h3 style="font-size: 1rem; font-weight: 600; color: #212121; margin: 0 0 1rem 0;">Work Details</h3>
            ${
              ticket.observation
                ? `
            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #757575; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Observation</label>
              <p style="color: #424242; line-height: 1.6; margin: 0; font-size: 0.938rem; padding-left: 0.75rem; border-left: 3px solid #1976d2;">${ticket.observation}</p>
            </div>
            `
                : ''
            }
            ${
              ticket.action_taken
                ? `
            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #757575; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Action Taken</label>
              <p style="color: #424242; line-height: 1.6; margin: 0; font-size: 0.938rem; padding-left: 0.75rem; border-left: 3px solid #1976d2;">${ticket.action_taken}</p>
            </div>
            `
                : ''
            }
            ${
              ticket.recommendation
                ? `
            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #757575; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Recommendation</label>
              <p style="color: #424242; line-height: 1.6; margin: 0; font-size: 0.938rem; padding-left: 0.75rem; border-left: 3px solid #1976d2;">${ticket.recommendation}</p>
            </div>
            `
                : ''
            }
          </div>
          `
              : ''
          }

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
      showDenyButton: this.canStartWork(ticket) || this.canResolve(ticket),
      denyButtonText: this.canStartWork(ticket)
        ? 'Start Working'
        : 'Complete Ticket',
      denyButtonColor: this.canStartWork(ticket) ? '#ff4081' : '#4caf50',
      confirmButtonText: 'Close',
      confirmButtonColor: '#1976d2',
    }).then((result) => {
      if (result.isDenied) {
        if (this.canStartWork(ticket)) {
          this.startWork(ticket);
        } else if (this.canResolve(ticket)) {
          this.resolveTicket(ticket);
        }
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
