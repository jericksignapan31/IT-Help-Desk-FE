import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { AssetService } from '../../services/asset.service';
import { EmployeeService } from '../../services/employee.service';
import {
  Asset,
  AssetStatus,
  AssetCondition,
  AssetType,
} from '../../models/asset.model';
import { Branch } from '../../models/branch.model';
import { Employee } from '../../models/employee.model';
import Swal from 'sweetalert2';
import * as QRCode from 'qrcode';

export interface AssetDialogData {
  asset?: Asset;
  isEditMode: boolean;
}

@Component({
  selector: 'app-asset-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
  ],
  templateUrl: './asset-dialog.component.html',
  styleUrls: ['./asset-dialog.component.scss'],
})
export class AssetDialogComponent implements OnInit {
  assetForm: FormGroup;
  isEditMode = false;
  isSaving = false;
  branches: Branch[] = [];
  employees: Employee[] = [];
  brands: any[] = [];
  loadingData = true;
  loadingEmployees = false;
  qrCodeDataUrl: string | null = null;
  showQRCode = false;
  createdAsset: Asset | null = null;

  assetTypes = Object.values(AssetType);
  statusOptions = Object.values(AssetStatus);
  conditionOptions = Object.values(AssetCondition);

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private employeeService: EmployeeService,
    public dialogRef: MatDialogRef<AssetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssetDialogData,
  ) {
    this.isEditMode = data.isEditMode;
    this.assetForm = this.fb.group({
      asset_tag: ['', [Validators.required, Validators.maxLength(50)]],
      type: ['', Validators.required],
      brand_id: [''],
      model: ['', [Validators.required, Validators.maxLength(100)]],
      serial_number: ['', Validators.maxLength(100)],
      status: ['available', Validators.required],
      condition: ['excellent', Validators.required],
      employee_id: [''],
      branch_id: ['', Validators.required],
      purchase_date: [''],
      warranty_expiry: [''],
      notes: ['', Validators.maxLength(500)],
      // Network Configuration fields
      ip_address: [''],
      mac_address: [''],
      hostname: [''],
      anydesk_id: [''],
    });
  }

  ngOnInit(): void {
    this.loadData();

    // Disable employee dropdown initially
    this.assetForm.get('employee_id')?.disable();

    // Watch for branch changes
    this.assetForm.get('branch_id')?.valueChanges.subscribe((branchId) => {
      this.onBranchChange(branchId);
    });

    if (this.isEditMode && this.data.asset) {
      this.assetForm.patchValue(this.data.asset);
      // Disable asset_tag in edit mode
      this.assetForm.get('asset_tag')?.disable();

      // Load employees for the asset's branch if in edit mode
      if (this.data.asset.branch_id) {
        this.loadEmployeesByBranch(this.data.asset.branch_id);
      }
    }
  }

  loadData(): void {
    this.loadingData = true;

    // Load branches
    this.employeeService.getBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
      },
      error: (error) => {
        console.error('Failed to load branches:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to load branches',
        });
      },
    });

    // Load brands
    this.assetService.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.loadingData = false;
      },
      error: (error) => {
        console.error('Failed to load brands:', error);
        this.loadingData = false;
      },
    });
  }

  onBranchChange(branchId: any): void {
    // Clear current employee selection
    this.assetForm.get('employee_id')?.setValue('');
    this.employees = [];

    if (!branchId) {
      // No branch selected - disable employee dropdown
      this.assetForm.get('employee_id')?.disable();
      return;
    }

    // Load employees for selected branch
    this.loadEmployeesByBranch(branchId);
  }

  loadEmployeesByBranch(branchId: string | number): void {
    this.loadingEmployees = true;
    this.assetForm.get('employee_id')?.disable();

    // Fetch employees filtered by branch_id and status=active
    this.employeeService
      .getEmployees({ branch_id: branchId, status: 'active' })
      .subscribe({
        next: (employees) => {
          this.employees = employees;
          this.loadingEmployees = false;
          this.assetForm.get('employee_id')?.enable();

          console.log(
            `Loaded ${employees.length} active employees for branch ${branchId}`,
          );

          if (employees.length === 0) {
            Swal.fire({
              icon: 'info',
              title: 'No Employees',
              text: 'No active employees found in this branch',
              timer: 3000,
              showConfirmButton: false,
            });
          }
        },
        error: (error) => {
          console.error('Failed to load employees for branch:', error);
          this.loadingEmployees = false;
          this.employees = [];

          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load employees for this branch. Please try again.',
            confirmButtonText: 'Retry',
          }).then((result) => {
            if (result.isConfirmed) {
              this.loadEmployeesByBranch(branchId);
            }
          });
        },
      });
  }

  onSubmit(): void {
    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    let assetData = this.assetForm.value;

    // Remove asset_tag from update data in edit mode
    if (this.isEditMode) {
      const { asset_tag, ...updateData } = assetData;
      assetData = updateData;
    }

    // Check if token exists
    const token = localStorage.getItem('access_token');
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Not Authenticated',
        text: 'You are not logged in. Please login again.',
      });
      this.isSaving = false;
      return;
    }

    const operation =
      this.isEditMode && this.data.asset?.id
        ? this.assetService.updateAsset(this.data.asset.id, assetData)
        : this.assetService.createAsset(assetData);

    operation.subscribe({
      next: (result) => {
        this.isSaving = false;
        this.createdAsset = result;

        // Generate QR code for new assets
        if (!this.isEditMode) {
          this.generateQRCode(result.asset_tag);
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Asset updated successfully',
            timer: 2000,
            showConfirmButton: false,
          });
          this.dialogRef.close(result);
        }
      },
      error: (error) => {
        console.error('Asset save FAILED:', error);

        let errorMessage = 'Unknown error';
        if (error.error?.message) {
          if (Array.isArray(error.error.message)) {
            errorMessage = error.error.message.join(', ');
          } else {
            errorMessage = error.error.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: `Failed to ${this.isEditMode ? 'update' : 'create'} asset: ${errorMessage}`,
        });
        this.isSaving = false;
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  generateQRCode(assetTag: string): void {
    const qrData = JSON.stringify({
      asset_tag: assetTag,
      type: 'asset',
      created_at: new Date().toISOString(),
    });

    QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        this.qrCodeDataUrl = url;
        this.showQRCode = true;
      })
      .catch((err) => {
        console.error('QR Code generation failed:', err);
        Swal.fire({
          icon: 'success',
          title: 'Asset Created!',
          text: 'Asset created successfully, but QR code generation failed.',
          timer: 2000,
          showConfirmButton: false,
        });
        this.dialogRef.close(this.createdAsset);
      });
  }

  downloadQRCode(): void {
    if (!this.qrCodeDataUrl || !this.createdAsset) return;

    const link = document.createElement('a');
    link.download = `QR_${this.createdAsset.asset_tag}.png`;
    link.href = this.qrCodeDataUrl;
    link.click();
  }

  closeWithQRCode(): void {
    this.dialogRef.close(this.createdAsset);
  }
}
