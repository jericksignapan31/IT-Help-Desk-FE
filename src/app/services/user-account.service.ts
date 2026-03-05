import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserAccount } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserAccountService {
  private readonly API_URL = 'http://localhost:3005';

  constructor(private http: HttpClient) {}

  getUserAccounts(): Observable<UserAccount[]> {
    return this.http.get<UserAccount[]>(`${this.API_URL}/user-accounts`);
  }

  getUserAccount(id: number): Observable<UserAccount> {
    return this.http.get<UserAccount>(`${this.API_URL}/user-accounts/${id}`);
  }

  createUserAccount(
    userAccount: Partial<UserAccount>,
  ): Observable<UserAccount> {
    return this.http.post<UserAccount>(
      `${this.API_URL}/user-accounts`,
      userAccount,
    );
  }

  updateUserAccount(
    id: number,
    userAccount: Partial<UserAccount>,
  ): Observable<UserAccount> {
    return this.http.patch<UserAccount>(
      `${this.API_URL}/user-accounts/${id}`,
      userAccount,
    );
  }

  deleteUserAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/user-accounts/${id}`);
  }

  activateAccount(id: number): Observable<UserAccount> {
    return this.http.patch<UserAccount>(`${this.API_URL}/user-accounts/${id}`, {
      is_active: true,
    });
  }

  deactivateAccount(id: number): Observable<UserAccount> {
    return this.http.patch<UserAccount>(`${this.API_URL}/user-accounts/${id}`, {
      is_active: false,
    });
  }
}
