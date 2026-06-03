import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OperationalDashboardDto } from '../models/operational-dashboard.model';
import { TacticalDashboardDto } from '../models/tactical-dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsDashboardService {
  private baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getOperationalDashboard(month?: number, year?: number): Observable<OperationalDashboardDto> {
    let url = `${this.baseUrl}/operational`;
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    return this.http.get<OperationalDashboardDto>(url);
  }

  getTacticalDashboard(month?: number, year?: number): Observable<TacticalDashboardDto> {
    let url = `${this.baseUrl}/tactical`;
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    return this.http.get<TacticalDashboardDto>(url);
  }
}
