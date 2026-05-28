import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { TicketPart } from '../../models/ticket-part.model';
import { TicketService } from '../../services/ticket.service';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-parts-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    MatCardModule,
    MatMenuModule,
  ],
  template: `
    <div *ngIf="parts.length > 0" class="parts-section">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Parts Tracking</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="parts-summary">
            <span>Total Cost: <strong>₱{{ totalPartsValue | number: '1.2-2' }}</strong></span>
            <span *ngIf="pendingPartsCount > 0" class="warning">
              <mat-icon>warning</mat-icon>
              {{ pendingPartsCount }} part(s) pending/ordered
            </span>
          </div>

          <table mat-table [dataSource]="parts" class="parts-table">
            <!-- Part Name -->
            <ng-container matColumnDef="part_name">
              <th mat-header-cell *matHeaderCellDef>Part Name</th>
              <td mat-cell *matCellDef="let part">{{ part.part_name }}</td>
            </ng-container>

            <!-- Quantity -->
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Qty</th>
              <td mat-cell *matCellDef="let part">{{ part.quantity }}</td>
            </ng-container>

            <!-- Unit Cost -->
            <ng-container matColumnDef="unit_cost">
              <th mat-header-cell *matHeaderCellDef>Unit Cost</th>
              <td mat-cell *matCellDef="let part">₱{{ part.unit_cost | number: '1.2-2' }}</td>
            </ng-container>

            <!-- Total Cost -->
            <ng-container matColumnDef="total_cost">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let part"><strong>₱{{ part.total_cost | number: '1.2-2' }}</strong></td>
            </ng-container>

            <!-- Supplier -->
            <ng-container matColumnDef="supplier">
              <th mat-header-cell *matHeaderCellDef>Supplier</th>
              <td mat-cell *matCellDef="let part">{{ part.supplier }}</td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let part">
                <mat-chip [color]="getStatusColor(part.status)" selected>
                  {{ part.status }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let part">
                <button 
                  *ngIf="canChangeStatus(part)" 
                  mat-icon-button 
                  matTooltip="Update Status"
                  [matMenuTriggerFor]="menu">
                  <mat-icon>edit</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button 
                    *ngIf="part.status === 'pending'" 
                    mat-menu-item 
                    (click)="updateStatus(part, 'ordered')">
                    <mat-icon>local_shipping</mat-icon>
                    <span>Mark as Ordered</span>
                  </button>
                  <button 
                    *ngIf="part.status === 'pending'" 
                    mat-menu-item 
                    (click)="updateStatus(part, 'received')">
                    <mat-icon>check_circle</mat-icon>
                    <span>Mark as Received</span>
                  </button>
                  <button 
                    *ngIf="part.status === 'ordered'" 
                    mat-menu-item 
                    (click)="updateStatus(part, 'received')">
                    <mat-icon>check_circle</mat-icon>
                    <span>Mark as Received</span>
                  </button>
                </mat-menu>

                <button 
                  *ngIf="!isReadOnly" 
                  mat-icon-button 
                  color="warn" 
                  (click)="deletePart(part)" 
                  matTooltip="Delete Part">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>

    <div *ngIf="parts.length === 0 && showEmpty" class="no-parts">
      <mat-card>
        <mat-card-content>
          <p>No parts requested for this ticket</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .parts-section {
      margin-top: 2rem;
    }

    .parts-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #fafafa;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .parts-summary span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .parts-summary .warning {
      color: #f57c00;
      font-weight: 500;
    }

    .parts-summary .warning mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    table {
      width: 100%;
    }

    .no-parts {
      margin-top: 2rem;
      text-align: center;
      color: #999;
    }

    mat-card {
      margin-bottom: 2rem;
    }
  `],
})
export class PartsListComponent implements OnInit, OnChanges {
  @Input() ticketId: string | number = '';
  @Input() parts: TicketPart[] = [];
  @Input() isReadOnly: boolean = false;
  @Input() showEmpty: boolean = true;
  @Output() partsUpdated = new EventEmitter<void>();

  displayedColumns = ['part_name', 'quantity', 'unit_cost', 'total_cost', 'supplier', 'status', 'actions'];
  totalPartsValue: number = 0;
  pendingPartsCount: number = 0;

  constructor(
    private ticketService: TicketService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.calculateTotals();
  }

  ngOnChanges(): void {
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.totalPartsValue = this.parts.reduce((sum, p) => sum + p.total_cost, 0);
    this.pendingPartsCount = this.parts.filter(p => p.status !== 'received').length;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warn';
      case 'ordered':
        return 'accent';
      case 'received':
        return 'primary';
      default:
        return '';
    }
  }

  updateStatus(part: TicketPart, newStatus: string): void {
    this.ticketService.updatePartStatus(this.ticketId, part.part_id, { status: newStatus as any })
      .subscribe(
        () => {
          this.partsUpdated.emit();
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: `Part status updated to ${newStatus}`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
        (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error?.message || 'Failed to update part status',
          });
        }
      );
  }

  deletePart(part: TicketPart): void {
    Swal.fire({
      title: 'Delete Part Request?',
      text: `Remove "${part.part_name}" from this ticket?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#f44336',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ticketService.deletePart(this.ticketId, part.part_id)
          .subscribe(
            () => {
              this.partsUpdated.emit();
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Part request has been removed',
                timer: 2000,
                showConfirmButton: false,
              });
            },
            (error) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.error?.message || 'Failed to delete part',
              });
            }
          );
      }
    });
  }

  canChangeStatus(part: TicketPart): boolean {
    return !this.isReadOnly && (part.status === 'pending' || part.status === 'ordered');
  }
}
