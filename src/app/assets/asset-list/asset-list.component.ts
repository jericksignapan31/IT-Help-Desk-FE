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
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset.service';
import { Asset, AssetStatus, AssetCondition } from '../../models/asset.model';
import { AuthService } from '../../services/auth.service';
import { AssetDialogComponent } from '../asset-dialog/asset-dialog.component';
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
    FormsModule,
  ],
  templateUrl: './asset-list.component.html',
  styleUrls: ['./asset-list.component.scss'],
})
export class AssetListComponent implements OnInit {
  assets: Asset[] = [];
  displayedColumns: string[] = [
    'asset_tag',
    'type',
    'model',
    'status',
    'condition',
    'employee',
    'actions',
  ];
  loading = true;

  filters = {
    search: '',
    status: '',
    condition: '',
  };

  statusOptions = Object.values(AssetStatus);
  conditionOptions = Object.values(AssetCondition);

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
    this.assetService.getAssets(this.filters).subscribe({
      next: (data) => {
        this.assets = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load assets:', err);
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.loadAssets();
  }

  clearFilters(): void {
    this.filters = { search: '', status: '', condition: '' };
    this.loadAssets();
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getConditionClass(condition: string): string {
    return `condition-${condition}`;
  }

  addAsset(): void {
    const dialogRef = this.dialog.open(AssetDialogComponent, {
      width: '800px',
      data: { isEditMode: false },
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
        this.assetService.deleteAsset(asset.id).subscribe({
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
        console.error('QR Code generation failed:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to generate QR code. Please try again.',
        });
      });
  }
}
