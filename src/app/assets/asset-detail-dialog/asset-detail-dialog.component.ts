import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Asset } from '../../models/asset.model';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-asset-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule,
  ],
  templateUrl: './asset-detail-dialog.component.html',
  styleUrls: ['./asset-detail-dialog.component.scss'],
})
export class AssetDetailDialogComponent {
  qrCodeDataUrl: string = '';

  constructor(
    public dialogRef: MatDialogRef<AssetDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { asset: Asset },
  ) {
    this.generateQRCode();
  }

  async generateQRCode(): Promise<void> {
    if (this.data.asset) {
      try {
        const qrData = JSON.stringify({
          asset_id: this.data.asset.asset_id,
          asset_tag: this.data.asset.asset_tag,
          category: this.data.asset.category,
          type: 'asset',
        });
        this.qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 1,
        });
      } catch (error) {
      }
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      available: 'primary',
      in_use: 'accent',
      maintenance: 'warn',
      retired: 'basic',
      disposed: 'basic',
    };
    return colors[status] || 'basic';
  }

  close(): void {
    this.dialogRef.close();
  }

  hasNetworkInfo(): boolean {
    const asset = this.data.asset;
    return !!(
      asset.ip_address ||
      asset.mac_address ||
      asset.hostname ||
      asset.anydesk_id
    );
  }

  hasSpecifications(): boolean {
    return (
      !!this.data.asset.specifications &&
      Object.keys(this.data.asset.specifications).length > 0
    );
  }
}
