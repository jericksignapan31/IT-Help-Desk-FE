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
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset.service';
import { Asset, AssetStatus, AssetCondition } from '../../models/asset.model';
import { AuthService } from '../../services/auth.service';

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
}
