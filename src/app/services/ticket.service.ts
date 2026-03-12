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

  getMyTickets(employeeId: number | string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(
      `${this.API_URL}/tickets/reporter/${employeeId}`,
    );
  }

  getAssignedToMe(employeeId: number | string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(
      `${this.API_URL}/tickets/assignee/${employeeId}`,
    );
  }

  // Search & Filter methods
  searchTickets(query: string): Observable<Ticket[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Ticket[]>(`${this.API_URL}/tickets/search`, {
      params,
    });
  }

  getTicketsByStatus(status: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.API_URL}/tickets/status/${status}`);
  }

  getTicketsByPriority(priority: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(
      `${this.API_URL}/tickets/priority/${priority}`,
    );
  }

  getTicketsByCategory(category: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(
      `${this.API_URL}/tickets/category/${category}`,
    );
  }

  // Approval workflow methods (Supervisor/Admin only)
  getPendingApprovals(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.API_URL}/tickets/pending-approvals`);
  }

  getTicketsByApprovalStatus(status: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(
      `${this.API_URL}/tickets/approval-status/${status}`,
    );
  }

  approveTicket(ticketId: number, assignedTo?: number): Observable<Ticket> {
    const payload: any = {};
    if (assignedTo) {
      payload.assigned_to = assignedTo;
    }
    return this.http.patch<Ticket>(
      `${this.API_URL}/tickets/${ticketId}/approve`,
      payload,
    );
  }

  rejectTicket(ticketId: number, reason: string): Observable<Ticket> {
    return this.http.patch<Ticket>(
      `${this.API_URL}/tickets/${ticketId}/reject`,
      { rejection_reason: reason },
    );
  }

  // IT Staff workflow methods
  startWork(ticketId: number, notes?: string): Observable<Ticket> {
    const payload: any = {};
    if (notes) {
      payload.notes = notes;
    }
    return this.http.patch<Ticket>(
      `${this.API_URL}/tickets/${ticketId}/start-work`,
      payload,
    );
  }

  completeTicket(ticketId: number, data: any): Observable<Ticket> {
    return this.http.patch<Ticket>(
      `${this.API_URL}/tickets/${ticketId}/complete`,
      data,
    );
  }
}
