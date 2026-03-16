import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RepairLog } from '../models/repair-log.model';
import { Ticket } from '../models/ticket.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RepairLogService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Fetch tickets and transform into repair log timeline
  getRepairLogs(params?: any): Observable<RepairLog[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http
      .get<Ticket[]>(`${this.API_URL}/tickets`, {
        params: httpParams,
      })
      .pipe(
        map((tickets) =>
          tickets.map((ticket) => this.transformTicketToRepairLog(ticket)),
        ),
      );
  }

  getRepairLog(ticketId: number): Observable<RepairLog> {
    return this.http
      .get<Ticket>(`${this.API_URL}/tickets/${ticketId}`)
      .pipe(map((ticket) => this.transformTicketToRepairLog(ticket)));
  }

  private transformTicketToRepairLog(ticket: Ticket): RepairLog {
    const requestedDate = new Date(ticket.created_at);
    const completedDate = ticket.resolved_at
      ? new Date(ticket.resolved_at)
      : null;

    let totalDays = 0;
    if (completedDate) {
      const diffTime = Math.abs(
        completedDate.getTime() - requestedDate.getTime(),
      );
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      ticket_id: ticket.ticket_id,
      ticket_subject: ticket.subject,
      asset_name: ticket.asset?.name,
      asset_tag: ticket.asset?.asset_tag,
      employee_name: ticket.reporter?.first_name
        ? `${ticket.reporter.first_name} ${ticket.reporter.last_name}`
        : 'Unknown',
      department: ticket.reporter?.department?.name,
      priority: ticket.priority,
      status: ticket.status,
      requested_date: ticket.created_at,
      approved_date: ticket.approved_at,
      started_date: ticket.started_at,
      completed_date: ticket.resolved_at,
      total_days: totalDays || undefined,
      assigned_to: ticket.assignedEmployee?.first_name
        ? `${ticket.assignedEmployee.first_name} ${ticket.assignedEmployee.last_name}`
        : undefined,
      observation: ticket.observation,
      action_taken: ticket.action_taken,
      recommendation: ticket.recommendation,
      resolution_notes: ticket.resolution_notes,
      unit_status: ticket.unit_status,
    };
  }
}
