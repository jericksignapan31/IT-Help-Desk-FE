import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Brand,
  BrandCreateRequest,
  BrandUpdateRequest,
} from '../models/brand.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private readonly API_URL = `${environment.apiUrl}/brands`;

  constructor(private http: HttpClient) {}

  // Get all brands
  getAllBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.API_URL);
  }

  // Get brand by ID
  getBrandById(id: number | string): Observable<Brand> {
    return this.http.get<Brand>(`${this.API_URL}/${id}`);
  }

  // Create new brand
  createBrand(brand: BrandCreateRequest): Observable<Brand> {
    return this.http.post<Brand>(this.API_URL, brand);
  }

  // Update existing brand
  updateBrand(
    id: number | string,
    brand: BrandUpdateRequest,
  ): Observable<Brand> {
    return this.http.put<Brand>(`${this.API_URL}/${id}`, brand);
  }

  // Delete brand
  deleteBrand(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  // Toggle brand active status
  toggleBrandStatus(id: number | string, isActive: boolean): Observable<Brand> {
    return this.http.patch<Brand>(`${this.API_URL}/${id}/status`, {
      is_active: isActive,
    });
  }
}
