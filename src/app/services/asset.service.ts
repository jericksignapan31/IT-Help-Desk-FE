import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asset } from '../models/asset.model';
import { Brand } from '../models/brand.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AssetService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Assets
  getAssets(params?: any): Observable<Asset[]> {
    console.log('🔍 API CALL: GET /assets');
    console.log('  Params:', params);
    
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    const url = `${this.API_URL}/assets`;
    console.log('  Full URL:', url);
    
    return this.http.get<Asset[]>(url, {
      params: httpParams,
    });
  }

  // Search assets
  searchAssets(query: string): Observable<Asset[]> {
    console.log('🔍 API CALL: GET /assets/search');
    console.log('  Query:', query);
    
    const params = new HttpParams().set('q', query);
    const url = `${this.API_URL}/assets/search`;
    console.log('  Full URL:', url);
    
    return this.http.get<Asset[]>(url, { params });
  }

  // Get assets from user's branch (auto-filtered by JWT)
  getMyBranchAssets(): Observable<Asset[]> {
    console.log('🔍 API CALL: GET /assets/my-branch');
    const url = `${this.API_URL}/assets/my-branch`;
    console.log('  Full URL:', url);
    
    return this.http.get<Asset[]>(url);
  }

  // Get assets by employee
  getAssetsByEmployee(employeeId: string): Observable<Asset[]> {
    console.log('🔍 API CALL: GET /assets/employee/{id}');
    console.log('  Employee ID:', employeeId);
    
    const url = `${this.API_URL}/assets/employee/${employeeId}`;
    console.log('  Full URL:', url);
    
    return this.http.get<Asset[]>(url);
  }

  // Get assets by branch
  getAssetsByBranch(branchId: number): Observable<Asset[]> {
    console.log('🔍 API CALL: GET /assets/branch/{id}');
    console.log('  Branch ID:', branchId);
    
    const url = `${this.API_URL}/assets/branch/${branchId}`;
    console.log('  Full URL:', url);
    
    return this.http.get<Asset[]>(url);
  }

  // Get assets by status
  getAssetsByStatus(status: string): Observable<Asset[]> {
    console.log('🔍 API CALL: GET /assets/status/{status}');
    console.log('  Status:', status);
    
    const url = `${this.API_URL}/assets/status/${status}`;
    console.log('  Full URL:', url);
    
    return this.http.get<Asset[]>(url);
  }

  getAsset(id: string): Observable<Asset> {
    console.log('🔍 API CALL: GET /assets/{id}');
    console.log('  Asset ID:', id);
    
    const url = `${this.API_URL}/assets/${id}`;
    console.log('  Full URL:', url);
    
    return this.http.get<Asset>(url);
  }

  createAsset(asset: Partial<Asset>): Observable<Asset> {
    console.log('📝 API CALL: POST /assets');
    console.log('  Payload:', asset);
    
    const url = `${this.API_URL}/assets`;
    console.log('  Full URL:', url);
    
    return this.http.post<Asset>(url, asset);
  }

  updateAsset(id: string, asset: Partial<Asset>): Observable<Asset> {
    console.log('✏️ API CALL: PATCH /assets/{id}');
    console.log('  Asset ID:', id);
    console.log('  Payload:', asset);
    
    const url = `${this.API_URL}/assets/${id}`;
    console.log('  Full URL:', url);
    
    return this.http.patch<Asset>(url, asset);
  }

  deleteAsset(id: string): Observable<void> {
    console.log('🗑️ API CALL: DELETE /assets/{id}');
    console.log('  Asset ID:', id);
    
    const url = `${this.API_URL}/assets/${id}`;
    console.log('  Full URL:', url);
    
    return this.http.delete<void>(url);
  }

  assignAsset(assetId: string, employeeId: string): Observable<Asset> {
    console.log('👤 API CALL: PATCH /assets/{id} - ASSIGN');
    console.log('  Asset ID:', assetId);
    console.log('  Employee ID:', employeeId);
    
    const url = `${this.API_URL}/assets/${assetId}`;
    console.log('  Full URL:', url);
    
    return this.http.patch<Asset>(url, {
      assigned_to: employeeId,
      status: 'in-use',
    });
  }

  unassignAsset(assetId: string): Observable<Asset> {
    return this.http.patch<Asset>(`${this.API_URL}/assets/${assetId}`, {
      assigned_to: null,
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

  // Asset History
  getAssetHistory(
    assetId: string,
    limit: number = 50,
    offset: number = 0,
    type?: string,
  ): Observable<any> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<any>(`${this.API_URL}/assets/${assetId}/history`, {
      params,
    });
  }
}
