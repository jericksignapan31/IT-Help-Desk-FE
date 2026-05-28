import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Ticket, TicketStatus } from '../../models/ticket.model';
import { TicketPart } from '../../models/ticket-part.model';
import { TicketService } from '../../services/ticket.service';
import { PartsListComponent } from '../parts-list/parts-list.component';
import { PartsDialogComponent } from '../parts-dialog/parts-dialog.component';
import { CompleteTicketModalComponent } from '../complete-ticket-modal/complete-ticket-modal.component';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ticket-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatCardModule,
    MatDividerModule,
    PartsListComponent,
  ],
  template: `
    <div class="ticket-detail-dialog">
      <div class="dialog-header">
        <h2>Ticket #{{ ticket.ticket_id }}</h2>
        <button
          mat-icon-button
          (click)="dialogRef.close()"
          class="close-button"
          aria-label="Close dialog"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <mat-tab-group>
          <!-- Details Tab -->
          <mat-tab label="Details">
            <div class="tab-content">
              <div class="header-section">
                <h3>{{ ticket.subject }}</h3>
                <div class="status-chips">
                  <mat-chip [color]="getStatusColor(ticket.status)" selected>
                    {{ ticket.status | titlecase }}
                  </mat-chip>
                  <mat-chip [color]="getPriorityColor(ticket.priority)" selected>
                    {{ ticket.priority | titlecase }}
                  </mat-chip>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="description-section">
                <h4>Description</h4>
                <p>{{ ticket.description }}</p>
              </div>

              <mat-divider></mat-divider>

              <div class="info-grid">
                <div class="info-item">
                  <label>Category</label>
                  <span>{{ ticket.category | titlecase }}</span>
                </div>
                <div class="info-item">
                  <label>Approval Status</label>
                  <span>{{ ticket.approval_status | titlecase }}</span>
                </div>
                <div class="info-item">
                  <label>Reporter</label>
                  <span>
                    {{
                      ticket.reporter
                        ? ticket.reporter.first_name + ' ' + ticket.reporter.last_name
                        : 'N/A'
                    }}
                  </span>
                </div>
                <div class="info-item">
                  <label>Asset</label>
                  <span>
                    {{
                      ticket.asset
                        ? ticket.asset.asset_tag + ' (' + ticket.asset.category + ')'
                        : 'N/A'
                    }}
                  </span>
                </div>
                <div class="info-item">
                  <label>Created</label>
                  <span>{{ ticket.created_at | date: 'short' }}</span>
                </div>
                <div class="info-item" *ngIf="ticket.started_at">
                  <label>Started</label>
                  <span>{{ ticket.started_at | date: 'short' }}</span>
                </div>
                <div class="info-item" *ngIf="ticket.resolved_at">
                  <label>Resolved</label>
                  <span>{{ ticket.resolved_at | date: 'short' }}</span>
                </div>
              </div>

              <div *ngIf="ticket.observation || ticket.action_taken || ticket.recommendation">
                <mat-divider></mat-divider>
                <div class="work-details">
                  <h4>Work Details</h4>
                  <div *ngIf="ticket.observation" class="detail-item">
                    <strong>Observation:</strong>
                    <p>{{ ticket.observation }}</p>
                  </div>
                  <div *ngIf="ticket.action_taken" class="detail-item">
                    <strong>Action Taken:</strong>
                    <p>{{ ticket.action_taken }}</p>
                  </div>
                  <div *ngIf="ticket.recommendation" class="detail-item">
                    <strong>Recommendation:</strong>
                    <p>{{ ticket.recommendation }}</p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <mat-divider></mat-divider>
              <div class="action-buttons">
                <button
                  *ngIf="canCompleteTicket()"
                  mat-raised-button
                  color="accent"
                  (click)="openCompleteModal()"
                  class="complete-btn"
                >
                  <mat-icon>{{ ticket.status === TicketStatus.HOLD ? 'check_circle' : 'done_all' }}</mat-icon>
                  {{ ticket.status === TicketStatus.HOLD ? 'Resume Work' : 'Complete Ticket' }}
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- Parts Tab (Show when waiting_for_parts or parts exist) -->
          <mat-tab label="Parts ({{ parts.length }})" *ngIf="shouldShowPartsTab()">
            <div class="tab-content">
              <div *ngIf="ticket.status === TicketStatus.HOLD" class="waiting-for-parts-banner">
                <mat-icon>info</mat-icon>
                <span>Ticket is waiting for parts to arrive before completion</span>
              </div>

              <!-- Action Buttons for Hold Status -->
              <div *ngIf="ticket.status === TicketStatus.HOLD" class="hold-actions">
                <button
                  mat-raised-button
                  color="accent"
                  (click)="requestParts()"
                  class="add-parts-btn"
                >
                  <mat-icon>add_shopping_cart</mat-icon>
                  Request Parts
                </button>

                <button
                  mat-raised-button
                  color="primary"
                  (click)="markAsResolved()"
                  [disabled]="completing"
                  class="resolve-btn"
                >
                  <mat-icon>{{ completing ? 'hourglass_empty' : 'check_circle' }}</mat-icon>
                  {{ completing ? 'Marking...' : 'Mark as Resolved' }}
                </button>
              </div>

              <!-- Request Parts Button (if not on hold) -->
              <button
                *ngIf="ticket.status !== TicketStatus.HOLD"
                mat-raised-button
                color="accent"
                (click)="requestParts()"
                class="add-parts-btn"
              >
                <mat-icon>add_shopping_cart</mat-icon>
                Request Parts
              </button>

              <app-parts-list
                [ticketId]="ticket.ticket_id"
                [parts]="parts"
                [isReadOnly]="false"
                [showEmpty]="true"
                (partsUpdated)="loadParts()"
              ></app-parts-list>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .ticket-detail-dialog {
      width: 100%;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
      padding: 1rem;
    }

    .dialog-header h2 {
      margin: 0;
    }

    .close-button {
      position: absolute;
      right: 1rem;
      top: 1rem;
    }

    .tab-content {
      padding: 1.5rem;
    }

    .header-section {
      margin-bottom: 1.5rem;
    }

    .header-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .status-chips {
      display: flex;
      gap: 0.5rem;
    }

    .description-section {
      margin-bottom: 1.5rem;
    }

    .description-section h4 {
      margin: 0.5rem 0;
      font-weight: 600;
    }

    .description-section p {
      margin: 0;
      color: #666;
      line-height: 1.6;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-item label {
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #757575;
      margin-bottom: 0.25rem;
    }

    .info-item span {
      color: #212121;
      font-size: 0.938rem;
    }

    .work-details {
      margin-top: 1.5rem;
    }

    .work-details h4 {
      margin: 0.5rem 0;
      font-weight: 600;
    }

    .detail-item {
      margin-bottom: 1rem;
    }

    .detail-item strong {
      display: block;
      margin-bottom: 0.25rem;
      color: #212121;
    }

    .detail-item p {
      margin: 0;
      color: #666;
      line-height: 1.6;
      padding-left: 0.75rem;
      border-left: 3px solid #1976d2;
    }

    .add-parts-btn {
      margin-bottom: 1rem;
    }

    .hold-actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .resolve-btn {
      min-width: 150px;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
    }

    .complete-btn {
      min-width: 150px;
    }

    .waiting-for-parts-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
      margin-bottom: 1rem;
      color: #856404;
    }

    .waiting-for-parts-banner mat-icon {
      color: #ffc107;
    }
  `],
})
export class TicketDetailDialogComponent implements OnInit {
  parts: TicketPart[] = [];
  completing = false;
  TicketStatus = TicketStatus; // For template access

  constructor(
    public dialogRef: MatDialogRef<TicketDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public ticket: Ticket,
    private ticketService: TicketService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadParts();
  }

  canCompleteTicket(): boolean {
    return this.ticket.status === TicketStatus.IN_PROGRESS || this.ticket.status === TicketStatus.HOLD;
  }

  shouldShowPartsTab(): boolean {
    return this.ticket.status === TicketStatus.HOLD || this.parts.length > 0;
  }

  openCompleteModal(): void {
    const dialogRef = this.dialog.open(CompleteTicketModalComponent, {
      width: '600px',
      data: { ticketId: this.ticket.ticket_id },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.completeTicket(result);
      }
    });
  }

  completeTicket(data: any): void {
    this.completing = true;
    
    // Log what we're sending to backend
    console.log('📤 Sending complete ticket data:', {
      unit_status: data.unit_status,
      observation: data.observation,
      action_taken: data.action_taken,
    });
    
    this.ticketService.completeTicket(this.ticket.ticket_id, data).subscribe(
      (updatedTicket) => {
        this.completing = false;
        this.ticket = updatedTicket;
        this.loadParts();

        const isOnHold = updatedTicket.status === 'hold';
        Swal.fire({
          icon: 'success',
          title: isOnHold ? 'Ticket on Hold' : 'Ticket Completed',
          text: isOnHold
            ? `✅ Ticket is now waiting for parts`
            : '✅ Ticket has been marked as completed.',
          timer: 3000,
          showConfirmButton: false,
        });
      },
      (error) => {
        this.completing = false;
        const errorMsg = error.error?.message || 'Failed to complete ticket';
        console.error('❌ Error completing ticket:', errorMsg, error.error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMsg,
        });
      }
    );
  }

  loadParts(): void {
    this.ticketService.getPartsByTicket(this.ticket.ticket_id).subscribe(
      (parts) => {
        this.parts = parts;
      },
      (error) => console.error('Failed to load parts', error)
    );
  }

  requestParts(): void {
    const dialogRef = this.dialog.open(PartsDialogComponent, {
      width: '500px',
      data: { ticketId: this.ticket.ticket_id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.ticketService.requestParts(this.ticket.ticket_id, result).subscribe(
          () => {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Parts requested successfully',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadParts();
          },
          (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'Failed to request parts',
            });
          }
        );
      }
    });
  }

  markAsResolved(): void {
    Swal.fire({
      title: 'Mark Ticket as Resolved?',
      text: 'Are you sure you want to mark this ticket as resolved? Parts have been installed and work is complete.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Mark as Resolved',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.completing = true;

        // Send data to mark as resolved
        // Note: Backend needs to allow completing tickets in 'hold' status
        const updateData = {
          unit_status: 'working',
          observation: 'Parts received and installed',
          action_taken: 'Completed with new parts',
        };

        console.log('📤 Marking ticket as resolved (from hold status):', {
          currentStatus: this.ticket.status,
          unit_status: updateData.unit_status,
        });

        this.ticketService.completeTicket(this.ticket.ticket_id, updateData).subscribe(
          (updatedTicket) => {
            this.completing = false;
            this.ticket = updatedTicket;
            this.loadParts();

            Swal.fire({
              icon: 'success',
              title: 'Ticket Resolved',
              text: '✅ Ticket has been marked as resolved',
              timer: 3000,
              showConfirmButton: false,
            });
          },
          (error) => {
            this.completing = false;
            const errorMsg = error.error?.message || 'Failed to mark ticket as resolved';
            console.error('❌ Error marking as resolved:', errorMsg, error.error);
            
            // Check if error is about ticket status - provide helpful message
            if (errorMsg.includes('status') || errorMsg.includes('in progress')) {
              Swal.fire({
                icon: 'error',
                title: 'Cannot Complete From Hold Status',
                html: `<p>${errorMsg}</p><p style="margin-top: 10px; font-size: 0.9em;">
                  <strong>Note:</strong> Backend needs to support completing tickets from 'hold' status.
                </p>`,
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMsg,
              });
            }
          }
        );
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      [TicketStatus.PENDING_APPROVAL]: 'warn',
      [TicketStatus.APPROVED]: 'primary',
      [TicketStatus.ASSIGNED]: 'primary',
      [TicketStatus.IN_PROGRESS]: 'accent',
      [TicketStatus.HOLD]: 'warn',
      [TicketStatus.RESOLVED]: 'primary',
      [TicketStatus.REJECTED]: 'warn',
    };
    return colors[status] || '';
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      low: 'primary',
      medium: 'accent',
      high: 'warn',
    };
    return colors[priority] || '';
  }
}
