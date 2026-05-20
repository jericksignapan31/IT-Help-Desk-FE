import { Component, Inject, OnInit, inject } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { AssetService } from '../../services/asset.service';
import { EmployeeService } from '../../services/employee.service';
import { BrandService } from '../../services/brand.service';
import { forkJoin } from 'rxjs';
import { Asset, AssetStatus, AssetType } from '../../models/asset.model';
import { Brand } from '../../models/brand.model';
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
  brands: Brand[] = [];
  loadingData = true;
  loadingEmployees = false;
  qrCodeDataUrl: string | null = null;
  showQRCode = false;
  createdAsset: Asset | null = null;

  assetTypes = Object.values(AssetType);
  statusOptions = Object.values(AssetStatus);

  // Asset type abbreviations for auto-generated tags
  private assetTypeAbbreviations: { [key: string]: string } = {
    'computer': 'COM',
    'laptop': 'LAP',
    'printer': 'PRI',
    'monitor': 'MON',
    'phone': 'PHN',
    'tablet': 'TAB',
    'keyboard': 'KBD',
    'mouse': 'MSE',
    'other': 'OTH',
  };

  // Use inject() for BrandService to avoid DI ordering issues
  private brandService = inject(BrandService);

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private employeeService: EmployeeService,
    public dialogRef: MatDialogRef<AssetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssetDialogData | null = null,
  ) {
 
    this.isEditMode = data?.isEditMode ?? false;
    this.assetForm = this.fb.group({
      asset_tag: ['', [Validators.required, Validators.maxLength(50)]],
      category: ['', Validators.required],
      brand_id: [''],
      model: ['', [Validators.required, Validators.maxLength(100)]],
      serial_number: ['', Validators.maxLength(100)],
      status: ['available', Validators.required],
      employee_id: [''],
      branch_id: ['', Validators.required],
      notes: ['', Validators.maxLength(500)],
      // Network Configuration fields
      ip_address: [''],
      mac_address: [''],
      hostname: [''],
      anydesk_id: [''],
      // Specifications fields
      cpu: [''],
      ram: [''],
      storage: [''],
      display: [''],
      os: [''],
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

    // Disable asset_tag field always (cannot be edited by user)
    this.assetForm.get('asset_tag')?.disable();

    // Watch for category changes to auto-generate asset tag (in add mode only)
    if (!this.isEditMode) {
      this.assetForm.get('category')?.valueChanges.subscribe((category) => {
        this.generateAssetTag(category);
      });
    }

    if (this.isEditMode && this.data?.asset) {

      // Map backend field names to form field names if needed
      const assetData: any = this.data.asset;
      const formData: any = {
        ...this.data.asset,
        category: this.data.asset.category || assetData.type, // Handle both field names
        employee_id: this.data.asset.assigned_to || assetData.assigned_to, // Map assigned_to to employee_id
      };

      this.assetForm.patchValue(formData);

      // Load employees for the asset's branch if in edit mode
      if (this.data.asset.branch_id) {
        this.loadEmployeesByBranch(this.data.asset.branch_id);
      }
    }
  }

  loadData(): void {
    this.loadingData = true;
 

    // Verify services are available
    if (!this.brandService) {
      this.loadingData = false;
      return;
    }

    if (!this.employeeService) {
      this.loadingData = false;
      return;
    }

    // Load both branches and brands in parallel
    forkJoin({
      branches: this.employeeService.getBranches(),
      brands: this.brandService.getAllBrands(),
    }).subscribe({
      next: (result) => {
        this.branches = result.branches;
        this.brands = result.brands;
      
        this.loadingData = false;
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to load required data. Please try again.',
        });
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
    const formValue = this.assetForm.getRawValue();

 

    // Transform form data to match backend JSON structure
    const assetData: any = {
      brand_id: formValue.brand_id || undefined,
      branch_id: formValue.branch_id,
      category: formValue.category,
      model: formValue.model,
      serial_number: formValue.serial_number || undefined,
      status: formValue.status,
      assigned_to: formValue.employee_id || undefined, // Map 'employee_id' to 'assigned_to'
      notes: formValue.notes || undefined,
      // Network configuration
      ip_address: formValue.ip_address || undefined,
      mac_address: formValue.mac_address || undefined,
      hostname: formValue.hostname || undefined,
      anydesk_id: formValue.anydesk_id || undefined,
    };

    // Add asset_tag only for create mode
    if (!this.isEditMode) {
      assetData.asset_tag = formValue.asset_tag;
    }

    // Build specifications object if any spec field has value
    const hasSpecs =
      formValue.cpu ||
      formValue.ram ||
      formValue.storage ||
      formValue.display ||
      formValue.os;

    if (hasSpecs) {
      assetData.specifications = {
        cpu: formValue.cpu || undefined,
        ram: formValue.ram || undefined,
        storage: formValue.storage || undefined,
        display: formValue.display || undefined,
        os: formValue.os || undefined,
      };
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
      this.isEditMode && this.data?.asset?.asset_id
        ? this.assetService.updateAsset(this.data.asset.asset_id, assetData)
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

  generateAssetTag(category: string): void {
    if (!category) {
      this.assetForm.get('asset_tag')?.setValue('');
      return;
    }

    // Get the abbreviation for the selected category
    const abbreviation = this.assetTypeAbbreviations[category] || 'AST';

    // Get today's date in YYYYMMDD format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Query assets of this category to determine next sequence number
    this.assetService.getAssets({ category }).subscribe({
      next: (assets) => {
        const nextSequence = assets.length + 1;
        const sequenceStr = String(nextSequence).padStart(4, '0');
        const generatedTag = `${abbreviation}-${sequenceStr}-${dateStr}`;
        this.assetForm.get('asset_tag')?.setValue(generatedTag);
      },
      error: () => {
        // If query fails, start with 0001
        const generatedTag = `${abbreviation}-0001-${dateStr}`;
        this.assetForm.get('asset_tag')?.setValue(generatedTag);
      },
    });
  }

  closeWithQRCode(): void {
    this.dialogRef.close(this.createdAsset);
  }
}
