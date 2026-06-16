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
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // QR code and label dimensions
      const qrSize = 300;
      const padding = 20;
      const textHeight = 50;
      const totalHeight = qrSize + textHeight;

      canvas.width = qrSize + padding * 2;
      canvas.height = totalHeight + padding * 2;

      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx.drawImage(image, padding, padding, qrSize, qrSize);

      // Draw Asset Tag label below QR code
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(
        this.asset.asset_tag,
        canvas.width / 2,
        qrSize + padding + 15
      );

      // Download the canvas as PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `QR_${this.asset.asset_tag}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    };

    image.src = this.qrCodeDataUrl;
  }

  close(): void {
    this.dialogRef.close();
  }
}
