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
        console.log('👤 [Auth Changed] User data updated, reloading tickets...');
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
    
    // Only employees and supervisors should be restricted to their department
    const shouldApplyDepartmentFilter = (userRole === 'employee' || userRole === 'supervisor') && userDepartmentId;

    // DEBUG LOGGING
    console.log('🔍 [DEBUG] loadTickets:', {
      currentUser: currentUser?.email,
      userRole: userRole,
      userDepartmentId: userDepartmentId,
      shouldApplyDepartmentFilter: shouldApplyDepartmentFilter,
      fullEmployee: currentUser?.employee,
    });

    if (this.viewMode === 'pending-approvals') {
      // Apply department filter for supervisors
      if (shouldApplyDepartmentFilter) {
        console.log('📋 Using getPendingApprovals with department:', userDepartmentId);
        request = this.ticketService.getPendingApprovals(userDepartmentId);
      } else {
        console.log('📋 Using getPendingApprovals without department filter');
        request = this.ticketService.getPendingApprovals();
      }
    } else if (this.filters.search) {
      // Use search endpoint if search query exists
      if (shouldApplyDepartmentFilter) {
        console.log('🔍 Using search with department:', userDepartmentId);
        request = this.ticketService.getTicketsByDepartment(userDepartmentId, {
          search: this.filters.search,
        });
      } else {
        console.log('🔍 Using search without department filter');
        request = this.ticketService.searchTickets(this.filters.search);
      }
    } else if (this.statusFilter === 'completed') {
      // Special case: completed means resolved OR closed
      if (shouldApplyDepartmentFilter) {
        console.log('✅ Using getTicketsByDepartment with filters:', userDepartmentId);
        request = this.ticketService.getTicketsByDepartment(userDepartmentId, this.filters);
      } else {
        console.log('✅ Using getTickets without department filter');
        request = this.ticketService.getTickets(this.filters);
      }
    } else if (this.filters.status && !this.filters.priority) {
      // Use status filter endpoint
      if (shouldApplyDepartmentFilter) {
        console.log('⏳ Using getTicketsByDepartment with status:', userDepartmentId);
        request = this.ticketService.getTicketsByDepartment(userDepartmentId, {
          status: this.filters.status,
        });
      } else {
        console.log('⏳ Using getTicketsByStatus without department filter');
        request = this.ticketService.getTicketsByStatus(this.filters.status);
      }
    } else if (this.filters.priority && !this.filters.status) {
      // Use priority filter endpoint
      if (shouldApplyDepartmentFilter) {
        console.log('🎯 Using getTicketsByDepartment with priority:', userDepartmentId);
        request = this.ticketService.getTicketsByDepartment(userDepartmentId, {
          priority: this.filters.priority,
        });
      } else {
        console.log('🎯 Using getTicketsByPriority without department filter');
        request = this.ticketService.getTicketsByPriority(this.filters.priority);
      }
    } else {
      // Use general getTickets with params for combined filters
      if (shouldApplyDepartmentFilter) {
        console.log('📊 Using getTicketsByDepartment:', userDepartmentId);
        request = this.ticketService.getTicketsByDepartment(userDepartmentId, this.filters);
      } else {
        console.log('📊 Using getTickets without department filter');
        request = this.ticketService.getTickets(this.filters);
      }
    }

    request.subscribe({
      next: (data: Ticket[]) => {
        console.log('Loaded tickets:', data);
        console.log('Status filter:', this.statusFilter);
        console.log('Filters:', this.filters);
        
        // NEW: Log departments of received tickets
        const departments = new Set(data.map(t => t.reporter?.department_id || t.department_id || 'N/A'));
        const uniqueDepartments = Array.from(departments);
        console.log('📊 Departments in response:', uniqueDepartments);
        console.log('📝 Total tickets received:', data.length);
        
        // CLIENT-SIDE FALLBACK: Filter by department if backend didn't do it
        const currentUser = this.authService.currentUserValue;
        const userRole = currentUser?.role;
        const userDepartmentId = currentUser?.employee?.department_id;
        const shouldFilter = (userRole === 'employee' || userRole === 'supervisor') && userDepartmentId;

        let filteredData = data;
        if (shouldFilter) {
          const beforeCount = data.length;
          filteredData = data.filter((ticket) => {
            const ticketDeptId = ticket.department_id || ticket.reporter?.department_id;
            return ticketDeptId === userDepartmentId;
          });
          console.log(`🔍 CLIENT-SIDE FILTERING: ${beforeCount} → ${filteredData.length} tickets (kept only dept: ${userDepartmentId})`);
        }
        
        // Filter for completed tickets (resolved OR closed)
        if (this.statusFilter === 'completed') {
          this.tickets = filteredData.filter(
            (t) => t.status === 'resolved' || t.status === 'closed',
          );
        } else {
          this.tickets = filteredData;
        }
        console.log('Final tickets after filter:', this.tickets);
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
    console.log('📋 [View Ticket] Full ticket object:', ticket);

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
            ticket.resolution_notes
              ? `
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #757575; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Resolution Notes</label>
            <p style="color: #424242; line-height: 1.6; margin: 0; font-size: 0.938rem; padding-left: 0.75rem; border-left: 3px solid #4caf50;">${ticket.resolution_notes}</p>
          </div>
          `
              : ''
          }

          ${
            ticket.rejection_reason
              ? `
          <div style="margin-bottom: 1.5rem; padding: 1rem; background: #ffebee; border-left: 4px solid #d32f2f; border-radius: 4px;">
            <label style="display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #d32f2f; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Rejection Reason</label>
            <p style="color: #c62828; line-height: 1.6; margin: 0; font-size: 0.938rem;">${ticket.rejection_reason}</p>
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
