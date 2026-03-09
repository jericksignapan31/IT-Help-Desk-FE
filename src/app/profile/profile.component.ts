import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../services/auth.service';

interface ProfileData {
  user_id: string;
  username: string;
  employee: {
    employee_id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    role: string;
    position: string;
    contact_number: string;
    employment_status: boolean;
    branch: {
      branch_id: string;
      branch_name: string;
      location: string;
      contact_number: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
    department: {
      department_id: string;
      department_name: string;
      description: string;
      created_at: string;
      updated_at: string;
    };
  };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profileData: ProfileData | null = null;
  loading = false;
  error = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = '';

    this.authService.getProfile().subscribe({
      next: (data) => {
        this.profileData = data;
        this.loading = false;
        console.log('Profile data loaded:', data);
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.error = 'Failed to load profile data';
        this.loading = false;
      },
    });
  }

  getFullName(): string {
    if (!this.profileData?.employee) return '';
    const { first_name, middle_name, last_name } = this.profileData.employee;
    return middle_name
      ? `${first_name} ${middle_name} ${last_name}`
      : `${first_name} ${last_name}`;
  }

  getRoleBadgeClass(): string {
    const role = this.profileData?.employee?.role?.toLowerCase();
    if (role === 'admin') return 'role-admin';
    if (role === 'technician') return 'role-technician';
    return 'role-user';
  }
}
