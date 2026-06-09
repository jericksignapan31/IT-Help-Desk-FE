import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserAccountService } from '../../services/user-account.service';
import { UserAccount } from '../../models/user-account.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-account-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './user-account-form.component.html',
  styleUrls: ['./user-account-form.component.scss'],
})
export class UserAccountFormComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isEditMode = false;
  userId: string | null = null;
  hidePassword = true;

  roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'it', label: 'IT Technician' },
    { value: 'employee', label: 'Employee' },
    { value: 'warehouse', label: 'Warehouse Staff' },
  ];

  constructor(
    private fb: FormBuilder,
    private userAccountService: UserAccountService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['employee', Validators.required],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.route.paramMap.subscribe((params) => {
      this.userId = params.get('id');
      if (this.userId) {
        this.isEditMode = true;
        this.loadUserAccount(this.userId);
        // Remove password requirement for edit mode
        this.form.get('password')?.clearAsyncValidators();
        this.form.get('password')?.setValidators([]);
        this.form.get('password')?.updateValueAndValidity();
      }
    });
  }

  loadUserAccount(id: string): void {
    this.isLoading = true;
    this.userAccountService.getUserAccount(Number(id)).subscribe({
      next: (userAccount: UserAccount) => {
        this.form.patchValue({
          username: userAccount.username,
          email: userAccount.email,
          role: userAccount.role || 'employee',
          is_active: userAccount.is_active !== false,
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user account:', error);
        this.snackBar.open('Failed to load user account', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/user-accounts']);
      },
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  getRoleLabel(roleValue: string): string {
    const role = this.roles.find((r) => r.value === roleValue);
    return role ? role.label : roleValue;
  }

  getRoleIcon(roleValue: string): string {
    const icons: { [key: string]: string } = {
      admin: 'admin_panel_settings',
      supervisor: 'security',
      it: 'engineering',
      employee: 'person',
      warehouse: 'inventory_2',
    };
    return icons[roleValue] || 'person';
  }

  getRoleDescription(roleValue: string): string {
    const descriptions: { [key: string]: string } = {
      admin: 'Full system access with complete control over all features, users, and configurations.',
      supervisor: 'Can approve tickets, manage team reports, and oversee department activities.',
      it: 'Can create, update, and resolve IT tickets. Full access to asset management.',
      employee: 'Can submit support requests and view personal tickets only.',
      warehouse: 'Can manage inventory, track stock, and handle warehouse operations.',
    };
    return descriptions[roleValue] || '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isLoading = true;
    const formValue = this.form.value;

    // For edit mode, exclude password if it's empty
    const submitData = { ...formValue };
    if (this.isEditMode && !submitData.password) {
      delete submitData.password;
    }

    const request$ = this.isEditMode
      ? this.userAccountService.updateUserAccount(Number(this.userId), submitData)
      : this.userAccountService.createUserAccount(submitData);

    request$.subscribe({
      next: (result) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: this.isEditMode ? 'User Updated' : 'User Created',
          text: this.isEditMode
            ? 'User account updated successfully'
            : 'User account created successfully',
          confirmButtonText: 'OK',
        }).then(() => {
          this.router.navigate(['/user-accounts']);
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error saving user account:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Failed to save user account',
        });
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/user-accounts']);
  }
}
