import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Branch,
  BranchCreateRequest,
  BranchUpdateRequest,
} from '../models/branch.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private readonly API_URL = `${environment.apiUrl}/branches`;

  constructor(private http: HttpClient) {}

  getAllBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(this.API_URL);
  }

  getBranchById(id: number | string): Observable<Branch> {
    return this.http.get<Branch>(`${this.API_URL}/${id}`);
  }

  createBranch(branch: BranchCreateRequest): Observable<Branch> {
    return this.http.post<Branch>(this.API_URL, branch);
  }

  updateBranch(
    id: number | string,
    branch: BranchUpdateRequest,
  ): Observable<Branch> {
    return this.http.patch<Branch>(`${this.API_URL}/${id}`, branch);
  }

  deleteBranch(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  toggleBranchStatus(id: number | string, status: string): Observable<Branch> {
   
    return this.http.patch<Branch>(`${this.API_URL}/${id}/status`, {
      status,
    });
  }
}
