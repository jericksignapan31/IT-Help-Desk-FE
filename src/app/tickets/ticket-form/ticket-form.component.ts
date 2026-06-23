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

    // Debug current user
    const currentUser = this.authService.currentUserValue;

    // Load branches first for admin/IT/supervisor
    const isRegularEmployee = this.authService.isUser();
   
  

    if (!isRegularEmployee) {
      this.loadBranches();
    }

    this.loadAssets();

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      const numericId = +id;

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


    // Log current user info for debugging
    const currentUser = this.authService.currentUserValue;


    let assetRequest: Observable<Asset[]>;

    if (isRegularEmployee) {
      // For employees: Use my-branch endpoint (auto-filtered by JWT on backend)
   
      assetRequest = this.assetService.getMyBranchAssets();
    } else {
      // For admin/IT/supervisor: Load all assets
    
      assetRequest = this.assetService.getAssets();
    }

    assetRequest.subscribe({
      next: (data) => {
        console.log('📦 [Ticket Form] Assets Loaded:', data);
        console.log('📊 Total Assets:', data.length);
        console.log('👤 Current User Role:', {
          isRegularEmployee,
          isAdmin,
          isIT,
          isSupervisor
        });

        if (data.length > 0) {
          console.log('📋 Asset Details:', data.map((a: any) => ({
            asset_tag: a.asset_tag,
            model: a.model,
            brand: a.brand?.brand_name || 'N/A',
            branch: a.branch?.branch_name || 'Unknown',
            category: a.category,
            status: a.status
          })));

          // Show branch distribution for admin/IT/supervisor
          if (!isRegularEmployee && data.length > 0) {
            const branchCounts = data.reduce((acc: any, asset) => {
              const branchName = asset.branch?.branch_name || 'Unknown';
              acc[branchName] = (acc[branchName] || 0) + 1;
              return acc;
            }, {});
            console.log('🏢 Assets by Branch:', branchCounts);
          }
        }

        this.assets = data;
        this.filteredAssets = data; // Initialize filtered assets
        this.loadingAssets = false;
        console.log('✅ Assets ready to display');

      

        // Group assets by branch for admin/IT/supervisor dropdown
        if (!isRegularEmployee && data.length > 0) {
          this.groupAssetsByBranch(this.filteredAssets);
        }

        if (data.length === 0) {
          const scope = isRegularEmployee ? 'your branch' : 'the system';

          if (isRegularEmployee) {
           
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
   
    this.loadingAssets = true;

    this.assetService.getAssets().subscribe({
      next: (data) => {
      

        if (data.length > 0) {
          data.slice(0, 3).forEach((asset, index) => {
           
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
    console.log('🔍 Filtering Assets by Branch:', this.selectedBranchId);

    if (!this.selectedBranchId) {
      // No filter - show all assets
      this.filteredAssets = this.assets;
      this.filteredAssetsByBranch = this.assetsByBranch;
      console.log('📋 No branch filter - showing all assets:', this.filteredAssets.length);
      return;
    }

    // Filter assets by selected branch ID
    this.filteredAssets = this.assets.filter((asset) => {
      return asset.branch_id?.toString() === this.selectedBranchId?.toString();
    });

    console.log('✅ Filtered Assets:', this.filteredAssets.map((a: any) => ({
      asset_tag: a.asset_tag,
      model: a.model,
      branch: a.branch?.branch_name
    })));
 
    // Re-group filtered assets for dropdown
    if (this.filteredAssets.length > 0) {
      this.groupAssetsByBranch(this.filteredAssets);
    } else {
      this.filteredAssetsByBranch = {};
      console.log('⚠️ No assets found for selected branch');
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

    // IMPORTANT: Do NOT send base64 image data to server
    // Base64 images are huge and cause 413 "Content Too Large" errors
    // Image preview is for UI only, not for submission
    // Always clear image_url before sending to server
    formData.image_url = '';

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
