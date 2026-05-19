import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset.service';
import { Asset, AssetStatus } from '../../models/asset.model';
import { AuthService } from '../../services/auth.service';
import { AssetDialogComponent } from '../asset-dialog/asset-dialog.component';
import { AssetDetailDialogComponent } from '../asset-detail-dialog/asset-detail-dialog.component';
import Swal from 'sweetalert2';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatTooltipModule,
    FormsModule,
  ],
  templateUrl: './asset-list.component.html',
  styleUrls: ['./asset-list.component.scss'],
})
export class AssetListComponent implements OnInit {
  assets: Asset[] = [];
  displayedColumns: string[] = [
    'asset_tag',
    'category',
    'model',
    'status',
    'employee',
    'qrcode',
    'actions',
  ];
  loading = true;

  filters = {
    search: '',
    status: '',
  };

  statusOptions = Object.values(AssetStatus);

  constructor(
    private assetService: AssetService,
    public authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(): void {
    this.loading = true;

    // Determine which API to use based on user role
    const isRegularEmployee = this.authService.isUser();
    const apiEndpoint = isRegularEmployee ? '/assets/my-branch' : '/assets';

    

    if (isRegularEmployee) {
    } else {
    }

    // Regular employees use my-branch endpoint (no filters needed)
    // IT/Supervisor/Admin use regular endpoint with filters - returns ALL branches
    const assetRequest = isRegularEmployee
      ? this.assetService.getMyBranchAssets()
      : this.assetService.getAssets(this.filters);

    assetRequest.subscribe({
      next: (data) => {

        if (data.length > 0) {

          // Show branch distribution for admin/IT/supervisor
          if (!isRegularEmployee && data.length > 0) {
            const branchCounts = data.reduce((acc: any, asset) => {
              const branchName = asset.branch?.branch_name || 'Unknown';
              acc[branchName] = (acc[branchName] || 0) + 1;
              return acc;
            }, {});
          }
        } else {
        }

        this.assets = data;
        this.loading = false;
      },
      error: (err) => {
      

        if (err.status === 401) {
         
          Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Your session has expired. Please login again.',
            confirmButtonText: 'Login',
          }).then(() => {
            // Redirect to login or handle re-authentication
            localStorage.removeItem('access_token');
            window.location.href = '/login';
          });
        }

        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.loadAssets();
  }

  clearFilters(): void {
    this.filters = { search: '', status: '' };
    this.loadAssets();
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  addAsset(): void {
    const dialogRef = this.dialog.open(AssetDialogComponent, {
      width: '800px',
      data: { isEditMode: false },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAssets();
      }
    });
  }

  editAsset(asset: Asset): void {
    const dialogRef = this.dialog.open(AssetDialogComponent, {
      width: '800px',
      data: { asset, isEditMode: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAssets();
      }
    });
  }

  viewAssetDetails(asset: Asset): void {
    this.dialog.open(AssetDetailDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { asset },
    });
  }

  deleteAsset(asset: Asset): void {
    Swal.fire({
      title: 'Delete Asset',
      text: `Are you sure you want to delete ${asset.asset_tag}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.assetService.deleteAsset(asset.asset_id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Asset has been deleted.',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadAssets();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: `Failed to delete asset: ${error.error?.message || error.message}`,
            });
          },
        });
      }
    });
  }

  downloadQRCode(asset: Asset): void {
    const qrData = JSON.stringify({
      asset_tag: asset.asset_tag,
      type: 'asset',
      created_at: asset.created_at || new Date().toISOString(),
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
        // Create download link
        const link = document.createElement('a');
        link.download = `QR_${asset.asset_tag}.png`;
        link.href = url;
        link.click();

        Swal.fire({
          icon: 'success',
          title: 'QR Code Downloaded!',
          text: `QR code for ${asset.asset_tag} has been downloaded.`,
          timer: 2000,
          showConfirmButton: false,
        });
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to generate QR code. Please try again.',
        });
      });
  }
}
