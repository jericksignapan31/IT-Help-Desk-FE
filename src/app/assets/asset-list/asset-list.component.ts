import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset.service';
import { Asset, AssetStatus } from '../../models/asset.model';
import { AuthService } from '../../services/auth.service';
import { AssetDialogComponent } from '../asset-dialog/asset-dialog.component';
import { AssetDetailDialogComponent } from '../asset-detail-dialog/asset-detail-dialog.component';
import { QrCodeViewerDialogComponent } from '../qr-code-viewer-dialog/qr-code-viewer-dialog.component';
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
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
  ],
  templateUrl: './asset-list.component.html',
  styleUrls: ['./asset-list.component.scss'],
})
export class AssetListComponent implements OnInit, AfterViewInit {
  assets: Asset[] = [];
  dataSource = new MatTableDataSource<Asset>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
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
    startDate: null as Date | null,
    endDate: null as Date | null,
  };

  statusOptions = Object.values(AssetStatus);

  constructor(
    private assetService: AssetService,
    public authService: AuthService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Initialization - paginator connection happens in AfterViewInit
  }

  ngAfterViewInit(): void {
    // Set paginator connection FIRST
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    // THEN load data
    this.loadAssets();
  }

  loadAssets(): void {
    this.loading = true;

    console.log('📦 ASSETS LOAD REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Determine which API to use based on user role
    const isRegularEmployee = this.authService.isUser();
    const apiEndpoint = isRegularEmployee ? '/assets/my-branch' : '/assets';

    console.log('User Role Check:');
    console.log('  Is Regular Employee:', isRegularEmployee);
    console.log('  API Endpoint:', apiEndpoint);
    console.log('  Filters:', this.filters);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Regular employees use my-branch endpoint (no filters needed)
    // IT/Supervisor/Admin use regular endpoint with filters - returns ALL branches
    const assetRequest = isRegularEmployee
      ? this.assetService.getMyBranchAssets()
      : this.assetService.getAssets(this.filters);

    assetRequest.subscribe({
      next: (data) => {
        console.log('✅ ASSETS LOADED SUCCESSFULLY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Total Assets:', data.length);
        console.log('Assets Data:', data);

        if (data.length > 0) {
          console.log('Sample Asset:', data[0]);

          // Show branch distribution for admin/IT/supervisor
          if (!isRegularEmployee && data.length > 0) {
            const branchCounts = data.reduce((acc: any, asset) => {
              const branchName = asset.branch?.branch_name || 'Unknown';
              acc[branchName] = (acc[branchName] || 0) + 1;
              return acc;
            }, {});
            console.log('Branch Distribution:', branchCounts);
          }
        } else {
          console.log('⚠️ No assets found');
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.assets = data;
        this.dataSource.data = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ ASSETS LOAD FAILED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Status Code:', err.status);
        console.error('Status Text:', err.statusText);
        console.error('URL:', err.url);
        console.error('Error Message:', err.message);
        console.error('Full Error:', err);
        console.error('Error Body:', err.error);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (err.status === 401) {
          console.error('⚠️ Unauthorized - Session expired');
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
        } else if (err.status === 403) {
          console.error('⚠️ Forbidden - No permission');
          Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You do not have permission to view assets.',
          });
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void {
    this.loadAssets();
  }

  clearFilters(): void {
    this.filters = { search: '', status: '', startDate: null, endDate: null };
    this.loadAssets();
  }

  downloadData(): void {
    if (this.dataSource.data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'There are no assets to download.',
      });
      return;
    }

    const startDate = this.filters.startDate 
      ? this.formatDate(this.filters.startDate) 
      : 'All';
    const endDate = this.filters.endDate 
      ? this.formatDate(this.filters.endDate) 
      : 'All';

    this.generateAssetsPDF(startDate, endDate);
  }

  private generateAssetsPDF(startDate: string, endDate: string): void {
    const headers = ['Asset Tag', 'Category', 'Brand', 'Model', 'Status', 'Assigned To', 'Created Date'];

    const tableData = [
      headers.map((h) => ({
        text: h,
        bold: true,
        color: '#ffffff',
        fillColor: '#1976d2',
        alignment: 'center',
        margin: [4, 6, 4, 6],
        fontSize: 9,
      })),
      ...this.dataSource.data.map((asset, index) => [
        {
          text: asset.asset_tag,
          margin: [4, 5, 4, 5],
          fontSize: 8,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: asset.category,
          margin: [4, 5, 4, 5],
          fontSize: 8,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: asset.brand?.brand_name || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 8,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: asset.model,
          margin: [4, 5, 4, 5],
          fontSize: 8,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: asset.status,
          margin: [4, 5, 4, 5],
          fontSize: 8,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: asset.assignedEmployee
            ? `${asset.assignedEmployee.first_name} ${asset.assignedEmployee.last_name}`
            : 'Unassigned',
          margin: [4, 5, 4, 5],
          fontSize: 8,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: asset.created_at ? new Date(asset.created_at).toLocaleDateString() : 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 8,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
      ]),
    ];

    const docDefinition: any = {
      content: [
        {
          text: 'Assets Inventory Report',
          style: 'header',
          alignment: 'center',
        },
        {
          text: `From: ${startDate}    To: ${endDate}`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', '*', 'auto', '*', 'auto'],
            body: tableData,
          },
          layout: 'lightHorizontalLines',
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 128, 0, 10],
                },
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 128, 0, 10],
                },
              ],
              [
                {
                  text: 'Signature',
                  alignment: 'center',
                  fontSize: 10,
                  margin: [0, 5, 0, 0],
                },
                {
                  text: 'Signature',
                  alignment: 'center',
                  fontSize: 10,
                  margin: [0, 5, 0, 0],
                },
              ],
            ],
          },
          layout: 'noBorders',
          margin: [0, 40, 0, 0],
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          italics: true,
        },
      },
      pageOrientation: 'landscape',
      pageMargins: [10, 10, 10, 10],
    };

    try {
      const pdfMake = (window as any).pdfMake;
      if (!pdfMake) {
        throw new Error('pdfMake library not initialized');
      }
      pdfMake.createPdf(docDefinition).download(`assets-${startDate}-to-${endDate}.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
      Swal.fire({
        icon: 'error',
        title: 'PDF Error',
        text: 'Failed to generate PDF. Please try again.',
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'PDF Downloaded',
      text: `Assets report downloaded successfully (${this.dataSource.data.length} records)!`,
      timer: 2000,
      showConfirmButton: false,
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
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
    this.dialog.open(QrCodeViewerDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: asset,
    });
  }

  oldDownloadQRCode(asset: Asset): void {
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
