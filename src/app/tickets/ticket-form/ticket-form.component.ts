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
    private authService: AuthService,
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
    this.assetService.getMyBranchAssets().subscribe({
      next: (data) => (this.assets = data),
      error: (err) => console.error('Failed to load assets:', err),
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
