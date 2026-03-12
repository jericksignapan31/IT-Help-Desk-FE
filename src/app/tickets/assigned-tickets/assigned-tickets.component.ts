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
      input: 'textarea',
      inputLabel: 'Notes (optional)',
      inputPlaceholder: 'e.g., Starting diagnosis...',
      showCancelButton: true,
      confirmButtonColor: '#3f51b5',
      cancelButtonColor: '#9e9e9e',
      confirmButtonText: 'Yes, start work',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ticketService
          .startWork(ticket.ticket_id, result.value || undefined)
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
              console.error('Failed to start work:', err);
              Swal.fire('Error', 'Failed to start work on ticket', 'error');
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
