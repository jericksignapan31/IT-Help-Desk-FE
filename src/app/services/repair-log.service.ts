import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RepairLog } from '../models/repair-log.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RepairLogService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRepairLogs(params?: any): Observable<RepairLog[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<RepairLog[]>(`${this.API_URL}/repair-logs`, {
      params: httpParams,
    });
  }

  getRepairLog(id: number): Observable<RepairLog> {
    return this.http.get<RepairLog>(`${this.API_URL}/repair-logs/${id}`);
  }

  createRepairLog(repairLog: Partial<RepairLog>): Observable<RepairLog> {
    return this.http.post<RepairLog>(`${this.API_URL}/repair-logs`, repairLog);
  }

  updateRepairLog(
    id: number,
    repairLog: Partial<RepairLog>,
  ): Observable<RepairLog> {
    return this.http.patch<RepairLog>(
      `${this.API_URL}/repair-logs/${id}`,
      repairLog,
    );
  }

  deleteRepairLog(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/repair-logs/${id}`);
  }

  getRepairLogsByAsset(assetId: number): Observable<RepairLog[]> {
    return this.http.get<RepairLog[]>(`${this.API_URL}/repair-logs`, {
      params: { asset_id: assetId.toString() },
    });
  }
}
