import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAvatarModule } from '@angular/material/avatar';
import { WarehouseService } from '../../services/warehouse.service';
import { AddCommentDto, RequisitionComment } from '../../models/requisition.model';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './comment-thread.component.html',
  styleUrls: ['./comment-thread.component.scss'],
})
export class CommentThreadComponent implements OnInit, OnDestroy {
  @Input() rfNumber: string = '';
  @Output() commentAdded = new EventEmitter<RequisitionComment>();

  comments: RequisitionComment[] = [];
  form: FormGroup;
  loading = false;
  loadingComments = false;
  currentUserRole: 'it' | 'warehouse' | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private warehouseService: WarehouseService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  ngOnInit(): void {
    this.loadComments();
    this.setUserRole();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadComments(): void {
    if (!this.rfNumber) return;

    this.loadingComments = true;
    this.warehouseService
      .getComments(this.rfNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comments) => {
          this.comments = comments;
          this.loadingComments = false;
        },
        error: (err) => {
          console.error('Error loading comments:', err);
          this.loadingComments = false;
        },
      });
  }

  addComment(): void {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Comment must be at least 5 characters',
      });
      return;
    }

    this.loading = true;
    const data: AddCommentDto = this.form.value;

    this.warehouseService
      .addComment(this.rfNumber, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comment) => {
          this.comments.push(comment);
          this.form.reset();
          this.loading = false;
          this.commentAdded.emit(comment);
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Failed to add comment',
          });
          this.loading = false;
        },
      });
  }

  setUserRole(): void {
    const user = this.authService.currentUserValue;
    if (user?.role === UserRole.IT || user?.role === UserRole.ADMIN) {
      this.currentUserRole = 'it';
    } else if (user?.role === UserRole.WAREHOUSE) {
      this.currentUserRole = 'warehouse';
    }
  }

  getRoleColor(role: 'it' | 'warehouse'): string {
    return role === 'it' ? '#2196F3' : '#FF9800';
  }

  getRoleLabel(role: 'it' | 'warehouse'): string {
    return role === 'it' ? 'IT' : 'Warehouse';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  isFormInvalid(): boolean {
    return this.form.invalid || this.loading;
  }
}
