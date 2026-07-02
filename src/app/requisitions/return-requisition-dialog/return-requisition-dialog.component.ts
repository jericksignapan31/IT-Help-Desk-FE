import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { WarehouseService } from '../../services/warehouse.service';
import { ReturnRequisitionDto, RequisitionItem } from '../../models/requisition.model';
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
    MatCardModule,
    MatDividerModule,
  ],
  templateUrl: './return-requisition-dialog.component.html',
  styleUrls: ['./return-requisition-dialog.component.scss'],
})
export class ReturnRequisitionDialogComponent {
  form: FormGroup;
  loading = false;
  isItemReturn = false;
  item?: RequisitionItem;

  constructor(
    private fb: FormBuilder,
    private warehouseService: WarehouseService,
    public dialogRef: MatDialogRef<ReturnRequisitionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { rfNumber: string; item?: RequisitionItem }
  ) {
    this.item = data.item;
    this.isItemReturn = !!data.item;
    
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

    if (this.isItemReturn && this.item) {
      // For item-level return, we can either:
      // 1. Add the item_id to the request
      // 2. Or return the whole requisition but note the specific item in the notes
      const enrichedNotes = `[Item: ${this.item.item_name}] ${requestData.warehouse_notes}`;
      const enrichedData = { ...requestData, warehouse_notes: enrichedNotes };
      
      this.warehouseService.returnRequisition(this.data.rfNumber, enrichedData).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: `Item "${this.item?.item_name}" in requisition ${this.data.rfNumber} marked for return`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Failed to return item',
          });
          this.loading = false;
        },
      });
    } else {
      // Full requisition return
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
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  isFormInvalid(): boolean {
    return this.form.invalid || this.loading;
  }
}
