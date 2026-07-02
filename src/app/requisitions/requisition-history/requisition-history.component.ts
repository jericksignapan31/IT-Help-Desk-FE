import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTimelineModule } from '@angular/material/timeline';
import { WarehouseService } from '../../services/warehouse.service';
import { RequisitionHistoryItem } from '../../models/requisition.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-requisition-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './requisition-history.component.html',
  styleUrls: ['./requisition-history.component.scss'],
})
export class RequisitionHistoryComponent implements OnInit, OnDestroy {
  @Input() rfNumber: string = '';

  history: RequisitionHistoryItem[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(private warehouseService: WarehouseService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHistory(): void {
    if (!this.rfNumber) return;

    this.loading = true;
    this.warehouseService
      .getRequisitionHistory(this.rfNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (historyItems) => {
          this.history = historyItems;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading history:', err);
          this.loading = false;
        },
      });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getTimelineIcon(index: number): string {
    const isLastItem = index === this.history.length - 1;
    return isLastItem ? 'check_circle' : 'sync';
  }

  getTimelineColor(index: number): string {
    const isLastItem = index === this.history.length - 1;
    return isLastItem ? 'accent' : 'primary';
  }
}
