import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TicketService } from '../../services/ticket.service';
import { AssetService } from '../../services/asset.service';
import { AuthService } from '../../services/auth.service';
import { BranchService } from '../../services/branch.service';
import { TicketCategory, TicketPriority } from '../../models/ticket.model';
import { Asset } from '../../models/asset.model';
import { Branch } from '../../models/branch.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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

  // File size limit: 20MB
  private readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

  categoryOptions = Object.values(TicketCategory);
  priorityOptions = Object.values(TicketPriority);

  assets: Asset[] = [];
  assetsByBranch: { [branchName: string]: Asset[] } = {};
  filteredAssets: Asset[] = [];
  filteredAssetsByBranch: { [branchName: string]: Asset[] } = {};

  // Branch filter
  branches: Branch[] = [];
  selectedBranchId: string | null = null;
  loadingBranches = false;

  // Camera properties
  isCameraOpen = false;
  videoStream: MediaStream | null = null;
  showCameraButtons = false;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private assetService: AssetService,
    private branchService: BranchService,
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
    console.log('🚀 [Ticket Form] ngOnInit started');

    // Debug current user
    const currentUser = this.authService.currentUserValue;
    console.log('👤 [Ticket Form] Current User Object:', currentUser);
    console.log('👤 [Ticket Form] User Role from Object:', currentUser?.role);

    // Load branches first for admin/IT/supervisor
    const isRegularEmployee = this.authService.isUser();
    console.log('👤 [Ticket Form] isRegularEmployee:', isRegularEmployee);
    console.log('👤 [Ticket Form] isAdmin:', this.authService.isAdmin());
    console.log(
      '👤 [Ticket Form] isTechnician:',
      this.authService.isTechnician(),
    );
    console.log(
      '👤 [Ticket Form] isSupervisor:',
      this.authService.isSupervisor(),
    );

    if (!isRegularEmployee) {
      console.log('🏢 [Ticket Form] Loading branches for admin/IT/supervisor');
      this.loadBranches();
    }

    this.loadAssets();

    const id = this.route.snapshot.paramMap.get('id');
    console.log('🔍 [Ticket Form] Route ID parameter:', id);

    if (id) {
      const numericId = +id;
      console.log('🔍 [Ticket Form] Converted to number:', numericId);

      if (!isNaN(numericId)) {
        this.isEditMode = true;
        this.ticketId = numericId;
        this.loadTicket(this.ticketId);
      } else {
        console.error('❌ [Ticket Form] Invalid ticket ID:', id);
        this.router.navigate(['/tickets']);
      }
    }
  }

  loadAssets(): void {
    this.loadingAssets = true;

    // Determine which API to use based on user role
    const isRegularEmployee = this.authService.isUser();
    const isAdmin = this.authService.isAdmin();
    const isIT = this.authService.isTechnician();
    const isSupervisor = this.authService.isSupervisor();

    console.log('🔄 [Ticket Form] Loading assets...');
    console.log('👤 [Ticket Form] User role checks:');
    console.log('   - isRegularEmployee (Employee/User):', isRegularEmployee);
    console.log('   - isAdmin:', isAdmin);
    console.log('   - isIT/Technician:', isIT);
    console.log('   - isSupervisor:', isSupervisor);

    // Log current user info for debugging
    const currentUser = this.authService.currentUserValue;
    console.log('👤 [Ticket Form] Current user:', currentUser);
    console.log('👤 [Ticket Form] User role from object:', currentUser?.role);

    let assetRequest: Observable<Asset[]>;

    if (isRegularEmployee) {
      // For employees: Use my-branch endpoint (auto-filtered by JWT on backend)
      console.log('🏢 [Ticket Form] Scope: MY BRANCH ONLY (Regular Employee)');
      console.log('📡 [Ticket Form] API Endpoint: /assets/my-branch');
      assetRequest = this.assetService.getMyBranchAssets();
    } else {
      // For admin/IT/supervisor: Load all assets
      console.log(
        '🌍 [Ticket Form] Scope: ALL BRANCHES (Admin/IT/Supervisor access)',
      );
      console.log('📡 [Ticket Form] API Endpoint: /assets (ALL branches)');
      assetRequest = this.assetService.getAssets();
    }

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
        this.filteredAssets = data; // Initialize filtered assets
        this.loadingAssets = false;

        console.log('✅ [Ticket Form] Assets assignment complete:');
        console.log('   - this.assets.length:', this.assets.length);
        console.log(
          '   - this.filteredAssets.length:',
          this.filteredAssets.length,
        );
        console.log('   - isRegularEmployee:', isRegularEmployee);

        // Group assets by branch for admin/IT/supervisor dropdown
        if (!isRegularEmployee && data.length > 0) {
          this.groupAssetsByBranch(this.filteredAssets);
        }

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
        this.filteredAssets = data; // Initialize filtered assets
        this.loadingAssets = false;

        // Group assets for admin/IT/supervisor
        if (data.length > 0) {
          this.groupAssetsByBranch(this.filteredAssets);
        }

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
    console.log('🔄 [Ticket Form] Loading ticket with ID:', id);

    if (!id || isNaN(id)) {
      console.error('❌ [Ticket Form] Invalid ticket ID for loading:', id);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Invalid ticket ID',
      });
      this.router.navigate(['/tickets']);
      return;
    }

    this.ticketService.getTicket(id).subscribe({
      next: (ticket) => {
        console.log('✅ [Ticket Form] Ticket loaded successfully:', ticket);
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
      error: (err) => {
        console.error('❌ [Ticket Form] Failed to load ticket:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load ticket details',
        });
        this.router.navigate(['/tickets']);
      },
    });
  }

  loadBranches(): void {
    this.loadingBranches = true;
    console.log('🏢 [Ticket Form] Loading branches for filter...');

    this.branchService.getAllBranches().subscribe({
      next: (branches) => {
        this.branches = branches.filter((b) => b.status === 'active');
        this.loadingBranches = false;
        console.log('✅ [Ticket Form] Branches loaded:', this.branches.length);
      },
      error: (err) => {
        console.error('❌ [Ticket Form] Failed to load branches:', err);
        this.loadingBranches = false;
      },
    });
  }

  groupAssetsByBranch(assetsToGroup: Asset[]): void {
    const grouped: { [branchName: string]: Asset[] } = {};

    assetsToGroup.forEach((asset) => {
      const branchName = asset.branch?.branch_name || 'Unknown Branch';

      if (!grouped[branchName]) {
        grouped[branchName] = [];
      }

      grouped[branchName].push(asset);
    });

    // Sort branch names alphabetically
    const sortedGrouped = Object.keys(grouped)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {});

    // Store in appropriate property based on whether filtering is active
    if (this.selectedBranchId) {
      this.filteredAssetsByBranch = sortedGrouped;
      console.log(
        '📂 [Ticket Form] Grouped FILTERED assets by branch:',
        Object.keys(this.filteredAssetsByBranch),
      );
    } else {
      this.assetsByBranch = sortedGrouped;
      this.filteredAssetsByBranch = sortedGrouped;
      console.log(
        '📂 [Ticket Form] Grouped assets by branch:',
        Object.keys(this.assetsByBranch),
      );
    }
  }

  getBranchNames(): string[] {
    return this.selectedBranchId
      ? Object.keys(this.filteredAssetsByBranch)
      : Object.keys(this.assetsByBranch);
  }

  filterAssetsByBranch(): void {
    console.log('🔍 [Ticket Form] Filtering by branch:', this.selectedBranchId);

    if (!this.selectedBranchId) {
      // No filter - show all assets
      this.filteredAssets = this.assets;
      this.filteredAssetsByBranch = this.assetsByBranch;
      console.log('🔍 [Ticket Form] Filter cleared - showing all assets');
      return;
    }

    // Filter assets by selected branch ID
    this.filteredAssets = this.assets.filter((asset) => {
      return asset.branch_id?.toString() === this.selectedBranchId?.toString();
    });

    console.log(
      `🔍 [Ticket Form] Filter applied - showing ${this.filteredAssets.length} of ${this.assets.length} assets`,
    );

    // Re-group filtered assets for dropdown
    if (this.filteredAssets.length > 0) {
      this.groupAssetsByBranch(this.filteredAssets);
    } else {
      this.filteredAssetsByBranch = {};
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        alert('Only JPEG and PNG images are allowed');
        return;
      }

      // Validate file size (20MB limit)
      if (file.size > this.MAX_FILE_SIZE) {
        alert('Image size must be less than 20MB');
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
    this.stopCamera();
  }

  async openCamera(): Promise<void> {
    try {
      // Stop any existing stream first
      this.stopCamera();

      console.log('📷 [Camera] Requesting camera access...');

      // Request camera access with mobile-friendly constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      this.videoStream = stream;
      this.isCameraOpen = true;
      this.showCameraButtons = true;

      console.log('✅ [Camera] Camera opened successfully');

      // Wait for DOM to update and attach stream to video element
      setTimeout(() => {
        const videoElement = document.getElementById(
          'cameraVideo',
        ) as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.play();
          console.log('📹 [Camera] Video stream attached to element');
        } else {
          console.error('❌ [Camera] Video element not found');
        }
      }, 100);
    } catch (error) {
      console.error('❌ [Camera] Failed to access camera:', error);
      Swal.fire({
        icon: 'error',
        title: 'Camera Access Denied',
        text: 'Unable to access camera. Please check your browser permissions.',
        confirmButtonColor: '#3f51b5',
      });
      this.isCameraOpen = false;
      this.showCameraButtons = false;
    }
  }

  capturePhoto(): void {
    const videoElement = document.getElementById(
      'cameraVideo',
    ) as HTMLVideoElement;
    const canvas = document.createElement('canvas');

    if (!videoElement || !this.videoStream) {
      console.error('❌ [Camera] No video stream available');
      return;
    }

    console.log('📸 [Camera] Capturing photo...');

    // Set canvas dimensions to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Draw current video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob then to file
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a File object from blob
            const file = new File([blob], `camera-${Date.now()}.jpg`, {
              type: 'image/jpeg',
            });
            this.selectedImageFile = file;

            // Create preview
            this.imagePreview = canvas.toDataURL('image/jpeg', 0.9);

            console.log('✅ [Camera] Photo captured successfully');
            console.log(
              '📊 [Camera] File size:',
              (blob.size / 1024).toFixed(2),
              'KB',
            );

            // Stop camera after capture
            this.stopCamera();

            Swal.fire({
              icon: 'success',
              title: 'Photo Captured',
              text: 'Photo captured successfully!',
              timer: 1500,
              showConfirmButton: false,
            });
          }
        },
        'image/jpeg',
        0.9,
      );
    }
  }

  stopCamera(): void {
    if (this.videoStream) {
      console.log('🛑 [Camera] Stopping camera stream...');
      this.videoStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.videoStream = null;
    }
    this.isCameraOpen = false;
    this.showCameraButtons = false;
  }

  toggleUploadMode(): void {
    if (this.isCameraOpen) {
      this.stopCamera();
    }
    this.showCameraButtons = !this.showCameraButtons;
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
