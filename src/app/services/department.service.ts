import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Department,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
} from '../models/department.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private readonly API_URL = `${environment.apiUrl}/departments`;

  constructor(private http: HttpClient) {}

  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.API_URL);
  }

  getDepartmentById(id: number | string): Observable<Department> {
    return this.http.get<Department>(`${this.API_URL}/${id}`);
  }

  createDepartment(
    department: DepartmentCreateRequest,
  ): Observable<Department> {
    return this.http.post<Department>(this.API_URL, department);
  }

  updateDepartment(
    id: number | string,
    department: DepartmentUpdateRequest,
  ): Observable<Department> {
    return this.http.patch<Department>(`${this.API_URL}/${id}`, department);
  }

  deleteDepartment(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  toggleDepartmentStatus(
    id: number | string,
    is_active: boolean,
  ): Observable<Department> {
    return this.http.patch<Department>(`${this.API_URL}/${id}/status`, {
      is_active,
    });
  }
}
