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
// @ts-ignore - jsQR is CommonJS module
import jsQR from 'jsqr';

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

    // Try camera access with fallback options
    const constraints = [
      // Try with environment camera first
      { video: { facingMode: { ideal: 'environment' } } },
      // Try without facingMode
      { video: true },
      // Try user camera
      { video: { facingMode: { ideal: 'user' } } },
    ];

    const tryCamera = (index: number) => {
      if (index >= constraints.length) {
        Swal.fire({
          icon: 'error',
          title: 'Camera Error',
          html: `<div style="text-align: left;">
            <p>Unable to access camera.</p>
            <p><strong>Solutions:</strong></p>
            <ul>
              <li>Check browser camera permissions</li>
              <li>Ensure you're on HTTPS or localhost</li>
              <li>Try allowing camera access again</li>
              <li>Use manual search instead</li>
            </ul>
          </div>`,
          confirmButtonText: 'Use Manual Search',
        }).then(() => {
          this.cameraActive = false;
          this.isScanning = false;
        });
        return;
      }

      navigator.mediaDevices
        .getUserMedia(constraints[index])
        .then((stream) => {
          if (this.videoElement) {
            this.videoElement.nativeElement.srcObject = stream;
            this.videoElement.nativeElement.onloadedmetadata = () => {
              this.videoElement.nativeElement.play();
              this.scanQRCode();
            };
          }
        })
        .catch((error) => {
          tryCamera(index + 1);
        });
    };

    tryCamera(0);
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
      console.log('📱 QR Code Detected:', code.data);
      this.processScannedCode(code.data);
      return;
    }

    // Continue scanning
    if (this.isScanning) {
      setTimeout(() => this.scanQRCode(), 500);
    }
  }

  processScannedCode(qrData: string): void {
    let assetTag: string | null = null;

    // First, try to parse as JSON (from our QR code generator)
    try {
      const qrObject = JSON.parse(qrData);
      if (qrObject.asset_tag) {
        assetTag = qrObject.asset_tag;
        console.log('✅ Parsed JSON QR Code - Asset Tag:', assetTag);
      }
    } catch (e) {
      // Not JSON, try regex patterns
      console.log('ℹ️ QR Code is not JSON, trying regex patterns');
    }

    // If JSON parsing failed, try regex patterns
    if (!assetTag) {
      const match = qrData.match(/(\w+-\d+-\d+)/); // e.g., "RT-0054-20260616"
      if (match) {
        assetTag = match[1];
        console.log('✅ Matched with pattern 1:', assetTag);
      } else {
        const match2 = qrData.match(/AST-\d+/); // e.g., "AST-001"
        if (match2) {
          assetTag = match2[0];
          console.log('✅ Matched with pattern 2:', assetTag);
        }
      }
    }

    if (assetTag) {
      console.log('🔍 Searching for asset:', assetTag);
      this.stopCamera();
      this.searchAssetByTag(assetTag);
    } else {
      console.log('❌ No valid asset tag found in QR code');
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
    this.assetService.getAssetHistory(String(assetId)).subscribe({
      next: (response: any) => {
        if (response.data && response.data.events) {
          this.assetHistory = response.data.events;
        } else {
          this.assetHistory = [];
        }
        this.loadingAsset = false;
      },
      error: (error) => {
        // Fallback to mock data if API fails
        this.assetHistory = [
          {
            id: 1,
            type: 'status_change',
            description: 'Asset status changed to in_use',
            timestamp: new Date().toISOString(),
            changedBy: 'System',
            changedByRole: 'SYSTEM',
          },
        ];
        this.loadingAsset = false;
        Swal.fire({
          icon: 'warning',
          title: 'Limited History',
          text: 'Could not load full asset history. Showing limited data.',
          timer: 3000,
        });
      },
    });
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
