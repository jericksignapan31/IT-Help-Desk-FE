import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { WarehouseService } from '../../services/warehouse.service';
import { ReturnRequisitionDto } from '../../models/requisition.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-return-requisition-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './return-requisition-dialog.component.html',
  styleUrls: ['./return-requisition-dialog.component.scss'],
})
export class ReturnRequisitionDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private warehouseService: WarehouseService,
    public dialogRef: MatDialogRef<ReturnRequisitionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { rfNumber: string }
  ) {
    this.form = this.fb.group({
      warehouse_notes: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please provide at least 10 characters for the return reason',
      });
      return;
    }

    this.loading = true;
    const requestData: ReturnRequisitionDto = this.form.value;

    this.warehouseService.returnRequisition(this.data.rfNumber, requestData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `Requisition ${this.data.rfNumber} returned successfully`,
          timer: 2000,
          showConfirmButton: false,
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Failed to return requisition',
        });
        this.loading = false;
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  isFormInvalid(): boolean {
    return this.form.invalid || this.loading;
  }
}
