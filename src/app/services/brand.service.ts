import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  // Transform backend response to frontend model (handles both old and new backend formats)
  private transformBrand(data: any): Brand {
    console.log('Transforming brand data:', data);
    console.log('Available keys:', Object.keys(data));
    const transformed = {
      id: data.id || data._id || data.brand_id,
      brand_name: data.brand_name || data.name,
      description: data.description,
      brand_image_url: data.brand_image_url || data.website_url,
      status: data.status !== undefined ? data.status : data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
    console.log('Transformed to:', transformed);
    return transformed;
  }

  // Get all brands
  getAllBrands(): Observable<Brand[]> {
    console.log('Calling API:', `${this.API_URL}`);
    return this.http.get<any[]>(this.API_URL).pipe(
      map((brands) => {
        console.log('Raw API response:', brands);
        return brands.map((brand) => this.transformBrand(brand));
      }),
    );
  }

  // Search brands
  searchBrands(query: string): Observable<Brand[]> {
    const params = new HttpParams().set('q', query);
    return this.http
      .get<any[]>(`${this.API_URL}/search`, { params })
      .pipe(map((brands) => brands.map((brand) => this.transformBrand(brand))));
  }

  // Get brand by ID
  getBrandById(id: number | string): Observable<Brand> {
    return this.http
      .get<any>(`${this.API_URL}/${id}`)
      .pipe(map((brand) => this.transformBrand(brand)));
  }

  // Create new brand
  createBrand(brand: BrandCreateRequest): Observable<Brand> {
    return this.http
      .post<any>(this.API_URL, brand)
      .pipe(map((response) => this.transformBrand(response)));
  }

  // Update existing brand
  updateBrand(
    id: number | string,
    brand: BrandUpdateRequest,
  ): Observable<Brand> {
    return this.http
      .patch<any>(`${this.API_URL}/${id}`, brand)
      .pipe(map((response) => this.transformBrand(response)));
  }

  // Delete brand
  deleteBrand(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  // Toggle brand active status
  toggleBrandStatus(id: number | string, status: boolean): Observable<Brand> {
    return this.http
      .patch<any>(`${this.API_URL}/${id}`, {
        status: status,
      })
      .pipe(map((response) => this.transformBrand(response)));
  }
}
