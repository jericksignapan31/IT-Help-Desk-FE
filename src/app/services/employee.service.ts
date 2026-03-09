import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../models/employee.model';
import { Branch } from '../models/branch.model';
import { Department } from '../models/department.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Employees
  getEmployees(params?: any): Observable<Employee[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Employee[]>(`${this.API_URL}/employees`, {
      params: httpParams,
    });
  }

  getEmployee(id: number | string): Observable<Employee> {
    return this.http.get<Employee>(`${this.API_URL}/employees/${id}`);
  }

  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(`${this.API_URL}/employees`, employee);
  }

  updateEmployee(
    id: number,
    employee: Partial<Employee>,
  ): Observable<Employee> {
    return this.http.patch<Employee>(
      `${this.API_URL}/employees/${id}`,
      employee,
    );
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/employees/${id}`);
  }

  toggleEmployeeStatus(
    id: string | number,
    employment_status: boolean,
  ): Observable<Employee> {
    return this.http.patch<Employee>(`${this.API_URL}/employees/${id}/status`, {
      employment_status,
    });
  }

  verifyEmployee(id: string | number): Observable<Employee> {
    return this.http.patch<Employee>(`${this.API_URL}/employees/${id}/verify`, {
      is_verified: true,
    });
  }

  // Departments
  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.API_URL}/departments`);
  }

  getDepartment(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.API_URL}/departments/${id}`);
  }

  createDepartment(department: Partial<Department>): Observable<Department> {
    return this.http.post<Department>(
      `${this.API_URL}/departments`,
      department,
    );
  }

  updateDepartment(
    id: number,
    department: Partial<Department>,
  ): Observable<Department> {
    return this.http.patch<Department>(
      `${this.API_URL}/departments/${id}`,
      department,
    );
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/departments/${id}`);
  }

  // Branches
  getBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(`${this.API_URL}/branches`);
  }

  getBranch(id: number): Observable<Branch> {
    return this.http.get<Branch>(`${this.API_URL}/branches/${id}`);
  }

  createBranch(branch: Partial<Branch>): Observable<Branch> {
    return this.http.post<Branch>(`${this.API_URL}/branches`, branch);
  }

  updateBranch(id: number, branch: Partial<Branch>): Observable<Branch> {
    return this.http.patch<Branch>(`${this.API_URL}/branches/${id}`, branch);
  }

  deleteBranch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/branches/${id}`);
  }
}
