import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Asset } from '../../models/asset.model';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code-viewer-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './qr-code-viewer-dialog.component.html',
  styleUrls: ['./qr-code-viewer-dialog.component.scss'],
})
export class QrCodeViewerDialogComponent implements OnInit {
  qrCodeDataUrl: string = '';
  loading = true;

  constructor(
    public dialogRef: MatDialogRef<QrCodeViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public asset: Asset,
  ) {}

  ngOnInit(): void {
    this.generateQRCode();
  }

  generateQRCode(): void {
    const qrData = JSON.stringify({
      asset_tag: this.asset.asset_tag,
      type: 'asset',
      created_at: this.asset.created_at || new Date().toISOString(),
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
        this.loading = false;
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        this.loading = false;
      });
  }

  downloadQRCode(): void {
    const link = document.createElement('a');
    link.download = `QR_${this.asset.asset_tag}.png`;
    link.href = this.qrCodeDataUrl;
    link.click();
  }

  close(): void {
    this.dialogRef.close();
  }
}
