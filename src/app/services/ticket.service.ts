import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket } from '../models/ticket.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTickets(params?: any): Observable<Ticket[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Ticket[]>(`${this.API_URL}/tickets`, {
      params: httpParams,
    });
  }

  getTicket(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.API_URL}/tickets/${id}`);
  }

  createTicket(ticket: Partial<Ticket>): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.API_URL}/tickets`, ticket);
  }

  updateTicket(id: number, ticket: Partial<Ticket>): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.API_URL}/tickets/${id}`, ticket);
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/tickets/${id}`);
  }

  assignTicket(ticketId: number, technicianId: number): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.API_URL}/tickets/${ticketId}`, {
      assigned_to: technicianId,
      status: 'in-progress',
    });
  }

  updateTicketStatus(
    ticketId: number,
    status: string,
    resolutionNotes?: string,
  ): Observable<Ticket> {
    const payload: any = { status };
    if (resolutionNotes) {
      payload.resolution_notes = resolutionNotes;
    }
    if (status === 'resolved' || status === 'closed') {
      payload.resolved_at = new Date().toISOString();
    }
    return this.http.patch<Ticket>(
      `${this.API_URL}/tickets/${ticketId}`,
      payload,
    );
  }

  getMyTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.API_URL}/tickets/my-tickets`);
  }

  getAssignedToMe(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.API_URL}/tickets/assigned-to-me`);
  }
}
