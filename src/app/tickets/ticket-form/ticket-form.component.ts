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
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { TicketCategory, TicketPriority } from '../../models/ticket.model';
import { Asset } from '../../models/asset.model';
import { Branch } from '../../models/employee.model';

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

  categoryOptions = Object.values(TicketCategory);
  priorityOptions = Object.values(TicketPriority);

  assets: Asset[] = [];
  branches: Branch[] = [];

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private assetService: AssetService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.ticketForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      priority: ['', Validators.required],
      asset_id: [null],
      branch_id: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadAssets();
    this.loadBranches();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.ticketId = +id;
      this.loadTicket(this.ticketId);
    }
  }

  loadAssets(): void {
    this.assetService.getAssets().subscribe({
      next: (data) => (this.assets = data),
      error: (err) => console.error('Failed to load assets:', err),
    });
  }

  loadBranches(): void {
    this.employeeService.getBranches().subscribe({
      next: (data) => (this.branches = data),
      error: (err) => console.error('Failed to load branches:', err),
    });
  }

  loadTicket(id: number): void {
    this.ticketService.getTicket(id).subscribe({
      next: (ticket) => {
        this.ticketForm.patchValue({
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          asset_id: ticket.asset_id,
          branch_id: ticket.branch_id,
        });
      },
      error: (err) => console.error('Failed to load ticket:', err),
    });
  }

  onSubmit(): void {
    if (this.ticketForm.invalid) {
      return;
    }

    this.loading = true;
    const formData = this.ticketForm.value;

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
