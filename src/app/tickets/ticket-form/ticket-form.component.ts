import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TicketService } from '../../services/ticket.service';
import { AssetService } from '../../services/asset.service';
import { AuthService } from '../../services/auth.service';
import { TicketCategory, TicketPriority } from '../../models/ticket.model';
import { Asset } from '../../models/asset.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './ticket-form.component.html',
  styleUrls: ['./ticket-form.component.scss'],
})
export class TicketFormComponent implements OnInit {
  ticketForm: FormGroup;
  loading = false;
  loadingAssets = false;
  isEditMode = false;
  ticketId: number | null = null;
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  categoryOptions = Object.values(TicketCategory);
  priorityOptions = Object.values(TicketPriority);

  assets: Asset[] = [];

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private assetService: AssetService,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.ticketForm = this.fb.group({
      subject: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      priority: ['', Validators.required],
      asset_id: [null, Validators.required],
      image_url: [''],
    });
  }

  ngOnInit(): void {
    this.loadAssets();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.ticketId = +id;
      this.loadTicket(this.ticketId);
    }
  }

  loadAssets(): void {
    this.loadingAssets = true;

    // Determine which API to use based on user role
    const isRegularEmployee = this.authService.isUser();
    const apiEndpoint = isRegularEmployee ? '/assets/my-branch' : '/assets';

    console.log('🔄 [Ticket Form] Loading assets...');
    console.log(
      '👤 [Ticket Form] User role - Regular Employee:',
      isRegularEmployee,
    );
    console.log('📡 [Ticket Form] API Endpoint:', apiEndpoint);

    // Log current user info for debugging
    const currentUser = this.authService.currentUserValue;
    console.log('👤 [Ticket Form] Current user:', currentUser);

    // Log JWT token to check branch_id
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔑 [Ticket Form] JWT Payload:', payload);
        console.log(
          '🏢 [Ticket Form] User branch_id from JWT:',
          payload.branch_id,
        );
      } catch (e) {
        console.error('❌ [Ticket Form] Failed to decode JWT:', e);
      }
    }

    if (isRegularEmployee) {
      console.log('🏢 [Ticket Form] Scope: MY BRANCH ONLY (filtered by JWT)');
    } else {
      console.log(
        '🌍 [Ticket Form] Scope: ALL BRANCHES (Admin/IT/Supervisor access)',
      );
    }

    // Regular employees use my-branch endpoint
    // Admin/IT/Supervisor use regular endpoint - returns ALL branches
    const assetRequest = isRegularEmployee
      ? this.assetService.getMyBranchAssets()
      : this.assetService.getAssets();

    assetRequest.subscribe({
      next: (data) => {
        console.log('✅ [Ticket Form] Assets loaded successfully!');
        console.log('📦 [Ticket Form] Total assets:', data.length);
        console.log('📋 [Ticket Form] Assets data:', data);

        if (data.length > 0) {
          console.log('🔍 [Ticket Form] First asset:', data[0]);
          console.log('🆔 [Ticket Form] First asset ID:', data[0].asset_id);
          console.log('🏷️ [Ticket Form] First asset tag:', data[0].asset_tag);
          console.log(
            '🏢 [Ticket Form] First asset branch_id:',
            data[0].branch_id,
          );

          // Show branch distribution for admin/IT/supervisor
          if (!isRegularEmployee && data.length > 0) {
            const branchCounts = data.reduce((acc: any, asset) => {
              const branchName = asset.branch?.branch_name || 'Unknown';
              acc[branchName] = (acc[branchName] || 0) + 1;
              return acc;
            }, {});
            console.log('🏢 [Ticket Form] Assets by branch:', branchCounts);
          }
        }

        this.assets = data;
        this.loadingAssets = false;

        if (data.length === 0) {
          const scope = isRegularEmployee ? 'your branch' : 'the system';
          console.warn(`⚠️ [Ticket Form] No assets found in ${scope}`);

          if (isRegularEmployee) {
            console.warn('💡 [Ticket Form] This could mean:');
            console.warn('   1. Your branch has no assets in the database');
            console.warn(
              '   2. All assets in your branch are already assigned',
            );
            console.warn(
              '   3. The branch_id in your JWT does not match any assets',
            );
          }

          Swal.fire({
            icon: 'info',
            title: 'No Assets Available',
            text: `There are no assets available in ${scope}. Please contact your administrator.`,
            confirmButtonColor: '#3f51b5',
          });
        }
      },
      error: (err) => {
        console.error('❌ [Ticket Form] Failed to load assets:', err);
        console.error('📊 [Ticket Form] Error status:', err.status);
        console.error('💬 [Ticket Form] Error details:', err.error);
        this.loadingAssets = false;

        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Assets',
          text: 'Unable to load assets. Please check your connection or contact support.',
          confirmButtonColor: '#3f51b5',
        });
      },
    });
  }

  loadAllAssets(): void {
    console.log(
      '🔄 [Ticket Form] Loading ALL assets (bypassing branch filter)...',
    );
    this.loadingAssets = true;

    this.assetService.getAssets().subscribe({
      next: (data) => {
        console.log('✅ [Ticket Form] All assets loaded:', data.length);
        console.log('📋 [Ticket Form] Assets:', data);

        if (data.length > 0) {
          console.log('🔍 [Ticket Form] Sample assets with branch info:');
          data.slice(0, 3).forEach((asset, index) => {
            console.log(`   Asset ${index + 1}:`, {
              asset_tag: asset.asset_tag,
              branch_id: asset.branch_id,
              branch_name: asset.branch?.branch_name || 'N/A',
            });
          });
        }

        this.assets = data;
        this.loadingAssets = false;

        if (data.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'No Assets in System',
            text: 'There are no assets in the entire system. Please add assets first.',
            confirmButtonColor: '#3f51b5',
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Assets Loaded',
            text: `Loaded ${data.length} assets from all branches. This is for debugging purposes.`,
            timer: 2000,
            showConfirmButton: false,
          });
        }
      },
      error: (err) => {
        console.error('❌ [Ticket Form] Failed to load all assets:', err);
        this.loadingAssets = false;
        Swal.fire({
          icon: 'error',
          title: 'Error Loading Assets',
          text: 'Failed to load assets. Please check console for details.',
          confirmButtonColor: '#3f51b5',
        });
      },
    });
  }

  loadTicket(id: number): void {
    this.ticketService.getTicket(id).subscribe({
      next: (ticket) => {
        this.ticketForm.patchValue({
          subject: ticket.subject,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          asset_id: ticket.asset_id,
          image_url: ticket.image_url,
        });
        if (ticket.image_url) {
          this.imagePreview = ticket.image_url;
        }
      },
      error: (err) => console.error('Failed to load ticket:', err),
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        alert('Only JPEG and PNG images are allowed');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      this.selectedImageFile = file;

      // Create image preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.ticketForm.patchValue({ image_url: '' });
  }

  onSubmit(): void {
    if (this.ticketForm.invalid) {
      return;
    }

    this.loading = true;
    const formData = this.ticketForm.value;

    // Note: In production, you would upload the image to a storage service first
    // and get the URL, then include that URL in the image_url field
    // For now, we'll just use the preview URL or empty string
    if (this.selectedImageFile && this.imagePreview) {
      formData.image_url = this.imagePreview;
    }

    const operation =
      this.isEditMode && this.ticketId
        ? this.ticketService.updateTicket(this.ticketId, formData)
        : this.ticketService.createTicket(formData);

    operation.subscribe({
      next: () => {
        this.router.navigate(['/tickets/my-tickets']);
      },
      error: (err) => {
        console.error('Failed to save ticket:', err);
        this.loading = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/tickets/my-tickets']);
  }
}
