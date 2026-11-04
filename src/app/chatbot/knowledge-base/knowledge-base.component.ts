import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { KnowledgeBaseService } from '../../services/knowledge-base.service';
import { FeedbackService } from '../../services/feedback.service';
import { KnowledgeBaseEntry } from '../../models/chat.model';
import { FeedbackModalComponent, FeedbackModalData, FeedbackModalResult } from '../components/feedback-modal/feedback-modal.component';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatTabsModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './knowledge-base.component.html',
  styleUrls: ['./knowledge-base.component.scss'],
})
export class KnowledgeBaseComponent implements OnInit, OnDestroy {
  // Search & Filter
  searchQuery = '';
  private searchSubject = new Subject<string>();
  
  // Categories
  categories: string[] = [];
  selectedCategories: Set<string> = new Set();
  
  // Results
  searchResults: KnowledgeBaseEntry[] = [];
  popularEntries: KnowledgeBaseEntry[] = [];
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalResults = 0;
  displayedResults: KnowledgeBaseEntry[] = [];
  
  // UI States
  isSearching = false;
  expandedResult: KnowledgeBaseEntry | null = null;
  ratedEntries: Map<string, 'helpful' | 'not_helpful'> = new Map();
  
  // Cleanup
  private destroy$ = new Subject<void>();

  // Template utility
  Array = Array;

  constructor(
    private kbService: KnowledgeBaseService,
    private feedbackService: FeedbackService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Load categories and popular entries
    this.categories = this.kbService.getCategories();
    this.popularEntries = this.kbService.getPopularEntries();
    this.updateDisplayedResults();

    // Setup debounced search
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((query) => {
        this.performSearch(query);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle search input - triggers debounced search
   */
  onSearchInput(value: any): void {
    this.searchQuery = value || '';
    this.pageIndex = 0;
    this.searchSubject.next(this.searchQuery);
  }

  /**
   * Perform actual search with API
   */
  private performSearch(query: string): void {
    if (!query.trim()) {
      this.searchResults = [];
      this.displayedResults = [];
      this.totalResults = 0;
      return;
    }

    this.isSearching = true;
    this.kbService.search(query).subscribe({
      next: (data) => {
        this.searchResults = data.results || [];
        this.totalResults = this.searchResults.length;
        this.filterAndPaginate();
        this.isSearching = false;
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.isSearching = false;
        this.searchResults = [];
        this.displayedResults = [];
      },
    });
  }

  /**
   * Toggle category filter (multi-select)
   */
  toggleCategory(category: string): void {
    this.pageIndex = 0;
    if (this.selectedCategories.has(category)) {
      this.selectedCategories.delete(category);
    } else {
      this.selectedCategories.add(category);
    }
    this.filterAndPaginate();
  }

  /**
   * Check if category is selected
   */
  isCategorySelected(category: string): boolean {
    return this.selectedCategories.has(category);
  }

  /**
   * Apply filters and pagination
   */
  private filterAndPaginate(): void {
    // Filter by selected categories
    let filtered = this.searchResults;
    if (this.selectedCategories.size > 0) {
      filtered = filtered.filter((entry) =>
        this.selectedCategories.has(entry.category)
      );
    }

    this.totalResults = filtered.length;

    // Apply pagination
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedResults = filtered.slice(startIndex, endIndex);
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.filterAndPaginate();
  }

  /**
   * Update displayed results when no search active
   */
  private updateDisplayedResults(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedResults = this.popularEntries.slice(startIndex, endIndex);
  }

  /**
   * Toggle expand result
   */
  toggleResult(result: KnowledgeBaseEntry): void {
    this.expandedResult = this.expandedResult?.knowledge_id === result.knowledge_id ? null : result;
  }

  /**
   * Mark answer as helpful
   */
  markHelpful(entry: KnowledgeBaseEntry): void {
    this.openFeedbackModal(entry, true);
  }

  /**
   * Mark answer as not helpful
   */
  markNotHelpful(entry: KnowledgeBaseEntry): void {
    this.openFeedbackModal(entry, false);
  }

  /**
   * Open feedback modal and handle submission
   */
  private openFeedbackModal(entry: KnowledgeBaseEntry, initialHelpful: boolean): void {
    const interactionId = uuidv4();
    const modalData: FeedbackModalData = {
      interactionId,
      subject: `Answer to: ${entry.question}`,
    };

    const dialogRef = this.dialog.open(FeedbackModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: modalData,
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result: FeedbackModalResult | undefined) => {
      if (result) {
        this.submitFeedback(entry, result);
      }
    });
  }

  /**
   * Submit feedback to backend
   */
  private submitFeedback(entry: KnowledgeBaseEntry, result: FeedbackModalResult): void {
    const interactionId = uuidv4();

    this.feedbackService
      .submitFeedback({
        interaction_id: interactionId,
        satisfaction_score: result.rating,
        is_helpful: result.isHelpful,
        user_feedback: result.comment || `Rating: ${result.rating}/5 stars`,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Mark as rated
          this.ratedEntries.set(entry.knowledge_id, result.isHelpful ? 'helpful' : 'not_helpful');
          console.log('Feedback submitted successfully');
        },
        error: (err) => {
          console.error('Failed to submit feedback:', err);
        },
      });
  }

  /**
   * Check if entry is rated
   */
  isRated(entry: KnowledgeBaseEntry): boolean {
    return this.ratedEntries.has(entry.knowledge_id);
  }

  /**
   * Get rating status
   */
  getRatingStatus(entry: KnowledgeBaseEntry): 'helpful' | 'not_helpful' | null {
    return this.ratedEntries.get(entry.knowledge_id) || null;
  }

  /**
   * Clear search and filters
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.selectedCategories.clear();
    this.expandedResult = null;
    this.pageIndex = 0;
    this.displayedResults = this.popularEntries.slice(0, this.pageSize);
  }

  /**
   * Get display results based on current state
   */
  getDisplayResults(): KnowledgeBaseEntry[] {
    if (this.searchQuery.trim() || this.selectedCategories.size > 0) {
      return this.displayedResults;
    }
    return this.displayedResults;
  }

  /**
   * Get total count for paginator
   */
  getTotalCount(): number {
    if (this.searchQuery.trim() || this.selectedCategories.size > 0) {
      return this.totalResults;
    }
    return this.popularEntries.length;
  }
}
