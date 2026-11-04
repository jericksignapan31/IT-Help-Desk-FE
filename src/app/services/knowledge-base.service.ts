import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { KnowledgeBaseEntry, KBSearchResult } from '../models/chat.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class KnowledgeBaseService {
  private apiUrl = `${environment.apiUrl}/chat/chatbot/kb`;

  // State
  private categoriesSubject = new BehaviorSubject<string[]>([]);
  private popularEntriesSubject = new BehaviorSubject<KnowledgeBaseEntry[]>([]);
  private searchResultsSubject = new BehaviorSubject<KnowledgeBaseEntry[]>([]);

  public categories$ = this.categoriesSubject.asObservable();
  public popularEntries$ = this.popularEntriesSubject.asObservable();
  public searchResults$ = this.searchResultsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCategories();
    this.loadPopularEntries();
  }

  /**
   * Load all KB categories
   */
  loadCategories(): void {
    this.http.get<{ categories: string[] }>(`${this.apiUrl}/categories`).subscribe({
      next: (data) => this.categoriesSubject.next(data.categories),
      error: (err) => console.error('Failed to load categories:', err),
    });
  }

  /**
   * Search knowledge base
   */
  search(query: string, limit: number = 5): Observable<KBSearchResult> {
    return this.http.post<KBSearchResult>(`${this.apiUrl}/search`, {
      query,
      limit,
    });
  }

  /**
   * Get FAQ by category
   */
  getByCategory(category: string): Observable<{ category: string; entries: KnowledgeBaseEntry[] }> {
    return this.http.get<{ category: string; entries: KnowledgeBaseEntry[] }>(
      `${this.apiUrl}/category/${category}`
    );
  }

  /**
   * Get popular/most helpful FAQs
   */
  getPopular(limit: number = 5): Observable<{ popular: KnowledgeBaseEntry[] }> {
    return this.http.get<{ popular: KnowledgeBaseEntry[] }>(`${this.apiUrl}/popular?limit=${limit}`);
  }

  /**
   * Load popular entries into state
   */
  loadPopularEntries(limit: number = 5): void {
    this.getPopular(limit).subscribe({
      next: (data) => this.popularEntriesSubject.next(data.popular),
      error: (err) => console.error('Failed to load popular entries:', err),
    });
  }

  /**
   * Update search results in state
   */
  setSearchResults(results: KnowledgeBaseEntry[]): void {
    this.searchResultsSubject.next(results);
  }

  /**
   * Get current search results
   */
  getSearchResults(): KnowledgeBaseEntry[] {
    return this.searchResultsSubject.value;
  }

  /**
   * Get current categories
   */
  getCategories(): string[] {
    return this.categoriesSubject.value;
  }

  /**
   * Get current popular entries
   */
  getPopularEntries(): KnowledgeBaseEntry[] {
    return this.popularEntriesSubject.value;
  }
}
