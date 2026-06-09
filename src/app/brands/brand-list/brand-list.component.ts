import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { BrandService } from '../../services/brand.service';
import { Brand } from '../../models/brand.model';
import { BrandDialogComponent } from '../brand-dialog/brand-dialog.component';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-brand-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatPaginatorModule,
  ],
  templateUrl: './brand-list.component.html',
  styleUrls: ['./brand-list.component.scss'],
})
export class BrandListComponent implements OnInit, AfterViewInit {
  brands: Brand[] = [];
  dataSource = new MatTableDataSource<Brand>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  displayedColumns: string[] = [
    'brand_name',
    'description',
    'brand_image_url',
    'status',
    'actions',
  ];
  isLoading = false;
  searchControl = new FormControl('');

  constructor(
    private brandService: BrandService,
    private router: Router,
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
    // THEN load data and setup search
    this.loadBrands();
    this.setupSearch();
  }

  setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        if (searchTerm && searchTerm.trim()) {
          this.searchBrands(searchTerm.trim());
        } else {
          this.loadBrands();
        }
      });
  }

  searchBrands(query: string): void {
    this.isLoading = true;
    this.brandService.searchBrands(query).subscribe({
      next: (brands) => {
        this.brands = brands;
        this.dataSource.data = brands;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
      },
    });
  }

  loadBrands(): void {
    this.isLoading = true;
    this.brandService.getAllBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.dataSource.data = brands;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to load brands',
        });
        this.isLoading = false;
        this.cdr.detectChanges();
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
      text: `Are you sure you want to delete "${brand.brand_name}"? This action cannot be undone.`,
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

    const newStatus = !brand.status;
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
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to update brand status',
        });
      },
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
