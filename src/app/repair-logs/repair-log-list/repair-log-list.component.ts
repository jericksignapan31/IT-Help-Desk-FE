import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RepairLogService } from '../../services/repair-log.service';
import { RepairLog, RepairStatus } from '../../models/repair-log.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-repair-log-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './repair-log-list.component.html',
  styleUrls: ['./repair-log-list.component.scss'],
})
export class RepairLogListComponent implements OnInit {
  repairLogs: RepairLog[] = [];
  displayedColumns: string[] = [
    'ticket_id',
    'asset',
    'repair_type',
    'repair_date',
    'repairer',
    'cost',
    'status',
    'actions',
  ];
  isLoading = false;

  constructor(
    private repairLogService: RepairLogService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadRepairLogs();
  }

  loadRepairLogs(): void {
    this.isLoading = true;
    this.repairLogService.getRepairLogs().subscribe({
      next: (repairLogs) => {
        this.repairLogs = repairLogs;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading repair logs:', error);
        this.snackBar.open('Failed to load repair logs', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  createRepairLog(): void {
    this.router.navigate(['/repair-logs/create']);
  }

  editRepairLog(repairLog: RepairLog): void {
    this.router.navigate(['/repair-logs/edit', repairLog.id]);
  }

  viewRepairLog(repairLog: RepairLog): void {
    this.router.navigate(['/repair-logs', repairLog.id]);
  }

  deleteRepairLog(repairLog: RepairLog): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Repair Log',
        message:
          'Are you sure you want to delete this repair log? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && repairLog.id) {
        this.repairLogService.deleteRepairLog(repairLog.id).subscribe({
          next: () => {
            this.snackBar.open('Repair log deleted successfully', 'Close', {
              duration: 3000,
            });
            this.loadRepairLogs();
          },
          error: (error) => {
            console.error('Error deleting repair log:', error);
            this.snackBar.open('Failed to delete repair log', 'Close', {
              duration: 3000,
            });
          },
        });
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case RepairStatus.COMPLETED:
        return 'status-completed';
      case RepairStatus.IN_PROGRESS:
        return 'status-in-progress';
      case RepairStatus.PENDING:
        return 'status-pending';
      case RepairStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  formatCurrency(amount: number | undefined): string {
    return amount ? `$${amount.toFixed(2)}` : 'N/A';
  }
}
