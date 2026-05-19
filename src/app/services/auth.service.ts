import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  UserRole,
} from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    const storedUser = this.isBrowser
      ? localStorage.getItem('currentUser')
      : null;
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null,
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap((response: any) => {
        // Check if user is verified
        const backendUser = response.user;
        if (backendUser?.is_verified === false) {
          throw {
            status: 403,
            error: {
              message:
                'Your account is pending admin approval. Please wait for verification.',
            },
          };
        }

        // Transform backend response to match frontend User model
        const transformedUser: User = {
          id: backendUser?.user_id || backendUser?.id || '',
          username: backendUser?.username || '',
          email: backendUser?.employee?.email || backendUser?.email || '',
          role: (backendUser?.employee?.role ||
            backendUser?.role ||
            'user') as UserRole,
          employee_id:
            backendUser?.employee?.employee_id ||
            backendUser?.employee_id ||
            '',
          is_active: backendUser?.is_active !== false, // default to true
          is_verified: backendUser?.is_verified !== false, // default to true
          created_at: backendUser?.created_at || new Date().toISOString(),
          updated_at: backendUser?.updated_at || new Date().toISOString(),
        };

       

        if (this.isBrowser) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('currentUser', JSON.stringify(transformedUser));
        }
        this.currentUserSubject.next(transformedUser);
      }),
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${this.API_URL}/auth/signup`,
      data,
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/auth/profile`);
  }

  changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/auth/change-password`,
      data,
    );
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('access_token') : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.currentUserValue;
    return user ? roles.includes(user.role) : false;
  }

  // Role checking methods
  isAdmin(): boolean {
    return this.hasRole([UserRole.ADMIN]);
  }

  isSupervisor(): boolean {
    return this.hasRole([UserRole.SUPERVISOR]);
  }

  isTechnician(): boolean {
    return this.hasRole([UserRole.IT]);
  }

  isUser(): boolean {
    return this.hasRole([UserRole.EMPLOYEE]);
  }

  /**
   * Get current logged-in user (synchronous)
   * Use this when you need immediate access to user data
   */
  getCurrentUser(): User | null {
    return this.currentUserValue;
  }

  /**
   * Get current user as Observable
   * Use this when you want to subscribe to user changes
   */
  getCurrentUser$(): Observable<User | null> {
    return this.currentUser;
  }

  /**
   * Get formatted user info for display
   */
  getUserInfo(): {
    id: number | string | undefined;
    username: string;
    email: string;
    role: string;
    employeeId: number | string | undefined;
    isActive: boolean;
  } | null {
    const user = this.currentUserValue;
    if (!user) return null;

    return {
      id: user.id,
      username: user.username || 'N/A',
      email: user.email || 'N/A',
      role: user.role?.toUpperCase() || 'N/A',
      employeeId: user.employee_id,
      isActive: user.is_active || false,
    };
  }

  /**
   * Refresh user profile from server
   */
  refreshUserProfile(): Observable<any> {
    return this.getProfile().pipe(
      tap((user) => {
        if (this.isBrowser) {
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
      }),
    );
  }

  /**
   * Check if user has specific role
   */
  hasSpecificRole(role: UserRole): boolean {
    return this.currentUserValue?.role === role;
  }

  /**
   * Get user's role
   */
  getUserRole(): UserRole | null {
    return this.currentUserValue?.role || null;
  }

  /**
   * Get user's display name
   */
  getUserDisplayName(): string {
    const user = this.currentUserValue;
    return user?.username || 'Guest';
  }
}
