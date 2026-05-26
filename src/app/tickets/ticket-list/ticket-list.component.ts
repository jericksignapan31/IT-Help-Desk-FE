import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  ApprovalStatus,
} from '../../models/ticket.model';
import { AuthService } from '../../services/auth.service';
import { TicketDetailDialogComponent } from '../ticket-detail-dialog/ticket-detail-dialog.component';
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
    MatMenuModule,
    FormsModule,
  ],
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss'],
})
export class TicketListComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  displayedColumns: string[] = [
    'ticket_id',
    'subject',
    'image',
    'category',
    'priority',
    'status',
    'approval_status',
    'reporter',
    'department',
    'created_at',
    'duration',
    'actions',
  ];
  loading = true;
  viewMode: 'all' | 'pending-approvals' = 'all';
  statusFilter: string | null = null;
  private destroy$ = new Subject<void>();

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
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.statusFilter = data['statusFilter'] || null;
      if (this.statusFilter) {
        this.filters.status = this.statusFilter;
      }
      this.loadTickets();
    });

    // Subscribe to auth changes to reload tickets when user data updates
    this.authService.getCurrentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTickets();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTickets(): void {
    this.loading = true;

    let request: Observable<Ticket[]>;
    
    // Get current user's department for filtering
    const currentUser = this.authService.currentUserValue;
    const userDepartmentId = currentUser?.employee?.department_id;
    const userRole = currentUser?.role;
    
    // Only employees and supervisors should have department filter applied
    const shouldSendDepartmentFilter = (userRole === 'employee' || userRole === 'supervisor') && userDepartmentId;

    // Use new dedicated endpoints based on statusFilter
    if (this.statusFilter === 'pending_approval') {
      request = this.ticketService.getPendingTickets();
    } else if (this.statusFilter === 'assigned') {
      request = this.ticketService.getAssignedTickets();
    } else if (this.statusFilter === 'in_progress') {
      request = this.ticketService.getInProgressTickets();
    } else if (this.statusFilter === 'waiting_for_parts') {
      request = this.ticketService.getWaitingForPartsTickets();
    } else if (this.statusFilter === 'approved') {
      request = this.ticketService.getApprovedTickets();
    } else if (this.statusFilter === 'rejected') {
      request = this.ticketService.getRejectedTickets();
    } else if (this.statusFilter === 'completed' || this.statusFilter === 'resolved') {
      request = this.ticketService.getCompletedTickets();
    } else if (this.viewMode === 'pending-approvals') {
      if (shouldSendDepartmentFilter) {
        request = this.ticketService.getPendingApprovals(userDepartmentId);
      } else {
        request = this.ticketService.getPendingApprovals();
      }
    } else if (this.filters.search) {
      if (shouldSendDepartmentFilter) {
        request = this.ticketService.getTicketsByDepartment(userDepartmentId, {
          search: this.filters.search,
        });
      } else {
        request = this.ticketService.searchTickets(this.filters.search);
      }
    } else if (this.filters.status && !this.filters.priority) {
      if (shouldSendDepartmentFilter) {
        request = this.ticketService.getTicketsByDepartment(userDepartmentId, {
          status: this.filters.status,
        });
      } else {
        request = this.ticketService.getTicketsByStatus(this.filters.status);
      }
    } else if (this.filters.priority && !this.filters.status) {
      if (shouldSendDepartmentFilter) {
        request = this.ticketService.getTicketsByDepartment(userDepartmentId, {
          priority: this.filters.priority,
        });
      } else {
        request = this.ticketService.getTicketsByPriority(this.filters.priority);
      }
    } else {
      if (shouldSendDepartmentFilter) {
        request = this.ticketService.getTicketsByDepartment(userDepartmentId, this.filters);
      } else {
        request = this.ticketService.getTickets(this.filters);
      }
    }

    request.subscribe({
      next: (data: Ticket[]) => {
        console.log('✅ Loaded tickets:', data);
        console.log('📊 Total tickets received:', data.length);
        
        // Log departments of received tickets
        const departments = new Set(data.map(t => t.reporter?.department?.department_name || t.department_id || 'N/A'));
        const uniqueDepartments = Array.from(departments);
        console.log('🏢 Departments in response:', uniqueDepartments);
        
        // Filter for completed tickets (resolved OR closed)
        if (this.statusFilter === 'completed') {
          this.tickets = data.filter(
            (t) => t.status === 'resolved' || t.status === 'closed',
          );
        } else {
          this.tickets = data;
        }
        console.log('📋 Final tickets count after status filter:', this.tickets.length);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Failed to load tickets:', err);
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

  calculateDuration(ticket: Ticket): string {
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    // Determine duration based on ticket status
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      // Duration from work started to completed
      if (ticket.started_at && ticket.resolved_at) {
        startDate = new Date(ticket.started_at);
        endDate = new Date(ticket.resolved_at);
      }
    } else if (ticket.status === 'in_progress' || ticket.status === 'assigned') {
      // Duration from work started to now
      if (ticket.started_at) {
        startDate = new Date(ticket.started_at);
        endDate = new Date();
      }
    } else if (ticket.status === 'approved') {
      // Duration from creation to approval
      if (ticket.created_at && ticket.approved_at) {
        startDate = new Date(ticket.created_at);
        endDate = new Date(ticket.approved_at);
      }
    } else if (ticket.status === 'pending_approval') {
      // Duration from creation to now (still pending)
      if (ticket.created_at) {
        startDate = new Date(ticket.created_at);
        endDate = new Date();
      }
    }

    if (!startDate || !endDate) {
      return '-';
    }

    // Calculate difference in milliseconds
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  }

  getDurationTooltip(ticket: Ticket): string {
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return `Work in progress time: ${this.calculateDuration(ticket)}`;
    } else if (ticket.status === 'in_progress' || ticket.status === 'assigned') {
      return `Time in progress: ${this.calculateDuration(ticket)}`;
    } else if (ticket.status === 'approved') {
      return `Time to approve: ${this.calculateDuration(ticket)}`;
    } else if (ticket.status === 'pending_approval') {
      return `Time pending approval: ${this.calculateDuration(ticket)}`;
    }
    return 'Duration';
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

  canResolve(ticket: Ticket): boolean {
    // IT staff can complete tickets that are in progress
    return (
      this.authService.isTechnician() &&
      ticket.status === TicketStatus.IN_PROGRESS
    );
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
              <option value="partially_working">Partially Working</option>
              <option value="need_buy_parts">⚠️ Need to Buy Parts</option>
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
              this.loadTickets();
            },
            error: (err) => {
              console.error('Failed to complete ticket:', err);
              Swal.fire('Error', 'Failed to complete ticket', 'error');
            },
          });
      }
    });
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
    const dialogRef = this.dialog.open(TicketDetailDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: ticket,
    });

    dialogRef.afterClosed().subscribe(() => {
      // Optional: refresh ticket list if needed
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

  viewImage(imageUrl: string): void {
    Swal.fire({
      imageUrl: imageUrl,
      imageAlt: 'Ticket attachment',
      showConfirmButton: true,
      confirmButtonText: 'Close',
      width: 'auto',
      background: '#000',
      didOpen: () => {
        const image = document.querySelector('.swal2-image') as HTMLImageElement;
        if (image) {
          image.style.maxHeight = '600px';
          image.style.maxWidth = '80vw';
        }
      },
    });
  }
}
