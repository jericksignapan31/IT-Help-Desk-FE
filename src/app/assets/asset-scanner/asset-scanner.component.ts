import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset.service';
import { Asset } from '../../models/asset.model';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import * as QRCode from 'qrcode';
const jsQR = require('jsqr');

@Component({
  selector: 'app-asset-scanner',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatTabsModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    FormsModule,
  ],
  templateUrl: './asset-scanner.component.html',
  styleUrls: ['./asset-scanner.component.scss'],
})
export class AssetScannerComponent implements OnInit {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;

  scannedAsset: Asset | null = null;
  assetHistory: any[] = [];
  manualAssetTag: string = '';
  isBrowser: boolean;
  isScanning = false;
  cameraActive = false;
  loadingAsset = false;

  constructor(
    private assetService: AssetService,
    public authService: AuthService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.authService.isTechnician() && !this.authService.isAdmin()) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Only IT technicians and admins can access the scanner',
      });
    }
  }

  startCamera(): void {
    if (!this.isBrowser) return;

    this.cameraActive = true;
    this.isScanning = true;

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      .then((stream) => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = stream;
          this.videoElement.nativeElement.play();
          this.scanQRCode();
        }
      })
      .catch((error) => {
        console.error('Camera access denied:', error);
        Swal.fire({
          icon: 'error',
          title: 'Camera Error',
          text: 'Unable to access camera. Please check permissions.',
        });
        this.cameraActive = false;
        this.isScanning = false;
      });
  }

  stopCamera(): void {
    this.isScanning = false;
    this.cameraActive = false;

    if (this.videoElement?.nativeElement?.srcObject) {
      const stream = this.videoElement.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  scanQRCode(): void {
    if (!this.isScanning || !this.isBrowser) return;

    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;

    if (!video || !canvas) {
      setTimeout(() => this.scanQRCode(), 100);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setTimeout(() => this.scanQRCode(), 100);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code) {
      this.processScannedCode(code.data);
      return;
    }

    // Continue scanning
    if (this.isScanning) {
      setTimeout(() => this.scanQRCode(), 500);
    }
  }

  processScannedCode(qrData: string): void {
    // Extract asset tag from QR code
    // Expected format: "AST-001" or similar
    const assetTag = qrData.match(/AST-\d+/) || qrData.match(/\w+-\d+/);

    if (assetTag) {
      this.stopCamera();
      this.searchAssetByTag(assetTag[0]);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid QR Code',
        text: 'QR code does not contain a valid asset tag',
        timer: 2000,
      });
    }
  }

  searchAssetByTag(tag: string): void {
    this.manualAssetTag = tag;
    this.loadAssetByTag();
  }

  loadAssetByTag(): void {
    if (!this.manualAssetTag.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Field',
        text: 'Please enter an asset tag',
      });
      return;
    }

    this.loadingAsset = true;
    this.scannedAsset = null;
    this.assetHistory = [];

    // Search for asset by tag
    this.assetService.getAssets({ search: this.manualAssetTag }).subscribe({
      next: (assets) => {
        if (assets.length > 0) {
          this.scannedAsset = assets[0];
          this.loadAssetHistory(this.scannedAsset.asset_id);
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Asset Not Found',
            text: `No asset found with tag: ${this.manualAssetTag}`,
          });
          this.loadingAsset = false;
        }
      },
      error: (err) => {
        console.error('Error searching asset:', err);
        Swal.fire({
          icon: 'error',
          title: 'Search Error',
          text: 'Failed to search for asset',
        });
        this.loadingAsset = false;
      },
    });
  }

  loadAssetHistory(assetId: number | string): void {
    // Load repair logs or ticket history for this asset
    // This would require a backend endpoint to get asset history
    // For now, we'll show basic asset info and assign it if needed

    // Mock history data - replace with actual API call
    this.assetHistory = [
      {
        id: 1,
        type: 'Status Change',
        description: 'Asset status changed to IN_USE',
        date: new Date().toISOString(),
        changedBy: 'Admin User',
      },
      {
        id: 2,
        type: 'Assignment',
        description: 'Assigned to John Doe',
        date: new Date(Date.now() - 86400000).toISOString(),
        changedBy: 'Admin User',
      },
      {
        id: 3,
        type: 'Repair',
        description: 'Replaced GPU',
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
        changedBy: 'IT Tech',
      },
    ];

    this.loadingAsset = false;
  }

  clearScan(): void {
    this.scannedAsset = null;
    this.assetHistory = [];
    this.manualAssetTag = '';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'IN_USE': '#4CAF50',
      'AVAILABLE': '#2196F3',
      'MAINTENANCE': '#FF9800',
      'RETIRED': '#9E9E9E',
      'LOST': '#D32F2F',
    };
    return colors[status] || '#757575';
  }

  updateAssetStatus(): void {
    if (!this.scannedAsset) return;

    Swal.fire({
      title: 'Update Asset Status',
      input: 'select',
      inputOptions: {
        'IN_USE': 'In Use',
        'AVAILABLE': 'Available',
        'MAINTENANCE': 'Maintenance',
        'RETIRED': 'Retired',
        'LOST': 'Lost',
      },
      inputPlaceholder: 'Select new status',
      showCancelButton: true,
      confirmButtonText: 'Update',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.assetService
          .updateAsset(this.scannedAsset!.asset_id, { status: result.value })
          .subscribe({
            next: () => {
              if (this.scannedAsset) {
                this.scannedAsset.status = result.value;
              }
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Asset status updated successfully',
                timer: 2000,
              });
            },
            error: (err) => {
              console.error('Error updating asset:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update asset status',
              });
            },
          });
      }
    });
  }

  assignAssetToEmployee(): void {
    if (!this.scannedAsset) return;

    Swal.fire({
      title: 'Assign Asset',
      input: 'text',
      inputLabel: 'Employee ID',
      inputPlaceholder: 'Enter employee ID',
      showCancelButton: true,
      confirmButtonText: 'Assign',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.assetService
          .updateAsset(this.scannedAsset!.asset_id, {
            assigned_to: result.value,
          })
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Asset assigned successfully',
                timer: 2000,
              });
              this.clearScan();
            },
            error: (err) => {
              console.error('Error assigning asset:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to assign asset',
              });
            },
          });
      }
    });
  }
}
