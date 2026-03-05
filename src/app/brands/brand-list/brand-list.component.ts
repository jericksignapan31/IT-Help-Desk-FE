import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BrandService } from '../../services/brand.service';
import { Brand } from '../../models/brand.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { BrandDialogComponent } from '../brand-dialog/brand-dialog.component';

@Component({
  selector: 'app-brand-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './brand-list.component.html',
  styleUrls: ['./brand-list.component.scss'],
})
export class BrandListComponent implements OnInit {
  brands: Brand[] = [];
  displayedColumns: string[] = [
    'name',
    'manufacturer',
    'description',
    'support_email',
    'status',
    'actions',
  ];
  isLoading = false;

  constructor(
    private brandService: BrandService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.isLoading = true;
    this.brandService.getAllBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading brands:', error);
        this.snackBar.open('Failed to load brands', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  createBrand(): void {
    const dialogRef = this.dialog.open(BrandDialogComponent, {
      width: '600px',
      data: {
        isEditMode: false,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadBrands();
      }
    });
  }

  editBrand(brand: Brand): void {
    const dialogRef = this.dialog.open(BrandDialogComponent, {
      width: '600px',
      data: {
        brand: brand,
        isEditMode: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadBrands();
      }
    });
  }

  deleteBrand(brand: Brand): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Brand',
        message: `Are you sure you want to delete "${brand.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && brand.id) {
        this.brandService.deleteBrand(brand.id).subscribe({
          next: () => {
            this.snackBar.open('Brand deleted successfully', 'Close', {
              duration: 3000,
            });
            this.loadBrands();
          },
          error: (error) => {
            console.error('Error deleting brand:', error);
            this.snackBar.open('Failed to delete brand', 'Close', {
              duration: 3000,
            });
          },
        });
      }
    });
  }

  toggleStatus(brand: Brand): void {
    if (!brand.id) return;

    const newStatus = !brand.is_active;
    this.brandService.toggleBrandStatus(brand.id, newStatus).subscribe({
      next: () => {
        this.snackBar.open(
          `Brand ${newStatus ? 'activated' : 'deactivated'} successfully`,
          'Close',
          { duration: 3000 },
        );
        this.loadBrands();
      },
      error: (error) => {
        console.error('Error updating brand status:', error);
        this.snackBar.open('Failed to update brand status', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
