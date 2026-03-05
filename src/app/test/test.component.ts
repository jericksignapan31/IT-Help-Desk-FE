import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div style="padding: 40px; max-width: 800px; margin: 0 auto;">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon style="vertical-align: middle;">bug_report</mat-icon>
            API Connection Test
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <h2>Frontend Status</h2>
          <p>✅ <strong>Routing Works!</strong> You're on the test page.</p>
          <p>
            <strong>Token:</strong>
            {{ token }}
          </p>

          <hr />

          <h2>Backend API Connection</h2>
          <div *ngIf="!tested">
            <button mat-raised-button color="primary" (click)="testApi()">
              <mat-icon>wifi</mat-icon>
              Test API Connection
            </button>
          </div>

          <div *ngIf="testing" style="text-align: center; padding: 20px;">
            <mat-spinner style="margin: 0 auto;"></mat-spinner>
            <p>Testing connection to {{ apiUrl }}...</p>
          </div>

          <div *ngIf="apiResponse && !testing">
            <h3 style="color: green;">✅ Connection Successful!</h3>
            <mat-card style="background: #e8f5e9; margin: 10px 0;">
              <mat-card-content>
                <strong>Response from backend:</strong>
                <pre>{{ apiResponse }}</pre>
              </mat-card-content>
            </mat-card>
          </div>

          <div *ngIf="apiError && !testing">
            <h3 style="color: red;">❌ Connection Failed</h3>
            <mat-card style="background: #ffebee; margin: 10px 0;">
              <mat-card-content>
                <strong>Error:</strong>
                <pre>{{ apiError }}</pre>
                <p>
                  <strong>Make sure your NestJS backend is running at:</strong>
                  <br />
                  {{ apiUrl }}
                </p>
              </mat-card-content>
            </mat-card>
            <button mat-raised-button color="accent" (click)="testApi()">
              <mat-icon>refresh</mat-icon>
              Retry
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      h1,
      h2,
      h3 {
        margin-top: 20px;
      }
      hr {
        margin: 30px 0;
        border: none;
        border-top: 1px solid #ddd;
      }
      pre {
        background: #f5f5f5;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
      }
    `,
  ],
})
export class TestComponent implements OnInit {
  token: string;
  apiUrl = 'http://localhost:3005';
  apiResponse: string | null = null;
  apiError: string | null = null;
  testing = false;
  tested = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private apiService: ApiService,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.token = localStorage.getItem('access_token') || 'No token found';
    } else {
      this.token = 'SSR - no localStorage';
    }
  }

  ngOnInit(): void {
    // Auto-test on load
    this.testApi();
  }

  testApi(): void {
    this.testing = true;
    this.tested = true;
    this.apiResponse = null;
    this.apiError = null;

    this.apiService.testConnection().subscribe({
      next: (response) => {
        this.testing = false;
        this.apiResponse = response;
      },
      error: (error) => {
        this.testing = false;
        this.apiError = JSON.stringify(
          {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            url: error.url,
          },
          null,
          2,
        );
      },
    });
  }
}
