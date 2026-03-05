import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asset, Brand } from '../models/asset.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AssetService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Assets
  getAssets(params?: any): Observable<Asset[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Asset[]>(`${this.API_URL}/assets`, {
      params: httpParams,
    });
  }

  getAsset(id: number): Observable<Asset> {
    return this.http.get<Asset>(`${this.API_URL}/assets/${id}`);
  }

  createAsset(asset: Partial<Asset>): Observable<Asset> {
    return this.http.post<Asset>(`${this.API_URL}/assets`, asset);
  }

  updateAsset(id: number, asset: Partial<Asset>): Observable<Asset> {
    return this.http.patch<Asset>(`${this.API_URL}/assets/${id}`, asset);
  }

  deleteAsset(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/assets/${id}`);
  }

  assignAsset(assetId: number, employeeId: number): Observable<Asset> {
    return this.http.patch<Asset>(`${this.API_URL}/assets/${assetId}`, {
      employee_id: employeeId,
      status: 'in-use',
    });
  }

  unassignAsset(assetId: number): Observable<Asset> {
    return this.http.patch<Asset>(`${this.API_URL}/assets/${assetId}`, {
      employee_id: null,
      status: 'available',
    });
  }

  // Brands
  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.API_URL}/brands`);
  }

  getBrand(id: number): Observable<Brand> {
    return this.http.get<Brand>(`${this.API_URL}/brands/${id}`);
  }

  createBrand(brand: Partial<Brand>): Observable<Brand> {
    return this.http.post<Brand>(`${this.API_URL}/brands`, brand);
  }

  updateBrand(id: number, brand: Partial<Brand>): Observable<Brand> {
    return this.http.patch<Brand>(`${this.API_URL}/brands/${id}`, brand);
  }

  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/brands/${id}`);
  }
}
