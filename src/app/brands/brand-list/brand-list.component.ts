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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BrandService } from '../../services/brand.service';
import { Brand } from '../../models/brand.model';
import { BrandDialogComponent } from '../brand-dialog/brand-dialog.component';
import Swal from 'sweetalert2';

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
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to load brands',
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
    Swal.fire({
      title: 'Delete Brand',
      text: `Are you sure you want to delete "${brand.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && brand.id) {
        this.brandService.deleteBrand(brand.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Brand deleted successfully',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadBrands();
          },
          error: (error) => {
            console.error('Error deleting brand:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to delete brand',
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
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Brand ${newStatus ? 'activated' : 'deactivated'} successfully`,
          timer: 2000,
          showConfirmButton: false,
        });
        this.loadBrands();
      },
      error: (error) => {
        console.error('Error updating brand status:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to update brand status',
        });
      },
    });
  }
}
