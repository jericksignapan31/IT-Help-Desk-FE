import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PartRequisition,
  CreatePartRequisitionDto,
  AcknowledgeRequisitionDto,
  ApproveRequisitionDto,
} from '../models/requisition.model';

export interface CreatePartRequestDto {
  part_name: string;
  quantity: number;
  unit_cost: number;
  supplier: string;
  notes?: string;
}

export interface WarehousePartRequest {
  request_id: string;
  requested_by: string;
  approved_by?: string;
  part_name: string;
  quantity: number;
  unit_cost: number | string;
  total_cost: number | string;
  supplier: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  notes?: string;
  requested_at: string;
  approved_at?: string;
  requester?: {
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ApprovePartRequestDto {
  action: 'approved' | 'rejected';
  rejection_reason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WarehouseService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Warehouse Staff Endpoints

  createPartRequest(data: CreatePartRequestDto): Observable<WarehousePartRequest> {
    return this.http.post<WarehousePartRequest>(
      `${this.API_URL}/warehouse/part-requests`,
      data
    );
  }

  getMyPartRequests(): Observable<WarehousePartRequest[]> {
    return this.http.get<WarehousePartRequest[]>(
      `${this.API_URL}/warehouse/part-requests/my-requests`
    );
  }

  getPartRequestById(id: string): Observable<WarehousePartRequest> {
    return this.http.get<WarehousePartRequest>(
      `${this.API_URL}/warehouse/part-requests/${id}`
    );
  }

  // Admin Endpoints

  getPendingPartRequests(): Observable<WarehousePartRequest[]> {
    return this.http.get<WarehousePartRequest[]>(
      `${this.API_URL}/warehouse/part-requests/pending`
    );
  }

  getAllPartRequests(): Observable<WarehousePartRequest[]> {
    return this.http.get<WarehousePartRequest[]>(
      `${this.API_URL}/warehouse/part-requests/all`
    );
  }

  approvePartRequest(
    id: string,
    data: ApprovePartRequestDto
  ): Observable<WarehousePartRequest> {
    return this.http.patch<WarehousePartRequest>(
      `${this.API_URL}/warehouse/part-requests/${id}/approve`,
      data
    );
  }

  // ===== REQUISITION ENDPOINTS =====

  // IT/WAREHOUSE: Create new requisition
  createRequisition(data: CreatePartRequisitionDto): Observable<PartRequisition> {
    return this.http.post<PartRequisition>(`${this.API_URL}/requisitions`, data);
  }

  // IT/WAREHOUSE: Get my requisitions
  getMyRequisitions(): Observable<PartRequisition[]> {
    return this.http.get<PartRequisition[]>(`${this.API_URL}/requisitions/my-requisitions`);
  }

  // WAREHOUSE: Get pending requisitions for review
  getPendingRequisitions(): Observable<PartRequisition[]> {
    return this.http.get<PartRequisition[]>(`${this.API_URL}/requisitions/pending`);
  }

  // ADMIN: Get requisitions pending admin review
  getPendingAdminReview(): Observable<PartRequisition[]> {
    return this.http.get<PartRequisition[]>(`${this.API_URL}/requisitions/all`);
  }

  // Get requisition detail by RF number
  getRequisitionByRfNumber(rfNumber: string): Observable<PartRequisition> {
    return this.http.get<PartRequisition>(`${this.API_URL}/requisitions/${rfNumber}`);
  }

  // WAREHOUSE: Acknowledge requisition
  acknowledgeRequisition(
    rfNumber: string,
    data: AcknowledgeRequisitionDto
  ): Observable<PartRequisition> {
    return this.http.patch<PartRequisition>(
      `${this.API_URL}/requisitions/${rfNumber}/acknowledge`,
      data
    );
  }

  // ADMIN: Approve or reject requisition
  approveRequisition(
    rfNumber: string,
    data: ApproveRequisitionDto
  ): Observable<PartRequisition> {
    return this.http.patch<PartRequisition>(
      `${this.API_URL}/requisitions/${rfNumber}/approve`,
      data
    );
  }
}
