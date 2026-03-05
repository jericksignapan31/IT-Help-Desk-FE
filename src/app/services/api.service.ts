import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Test API connection
   * GET http://localhost:3005
   * Returns: "Hello World!"
   */
  testConnection(): Observable<string> {
    return this.http.get(`${this.API_URL}`, { responseType: 'text' });
  }

  /**
   * Get API health status
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.API_URL}/health`);
  }
}
