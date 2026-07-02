import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { WarehouseService } from '../../services/warehouse.service';
import { PartRequisition, RequisitionItem } from '../../models/requisition.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-resubmit-requisition-dialog',
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
    MatTableModule,
  ],
  templateUrl: './resubmit-requisition-dialog.component.html',
  styleUrls: ['./resubmit-requisition-dialog.component.scss'],
})
export class ResubmitRequisitionDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;
  displayedColumns: string[] = ['item_name', 'quantity', 'unit', 'supplier', 'unit_cost', 'actions'];

  constructor(
    private fb: FormBuilder,
    private warehouseService: WarehouseService,
    public dialogRef: MatDialogRef<ResubmitRequisitionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { requisition: PartRequisition }
  ) {
    this.form = this.fb.group({
      it_response_notes: ['', [Validators.required, Validators.minLength(10)]],
      edited_items: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.initializeItems();
  }

  initializeItems(): void {
    const itemsArray = this.form.get('edited_items') as FormArray;
    this.data.requisition.items.forEach((item) => {
      itemsArray.push(
        this.fb.group({
          item_id: [item.item_id, Validators.required],
          item_name: [item.item_name, Validators.required],
          quantity: [item.quantity, [Validators.required, Validators.min(1)]],
          unit: [item.unit, Validators.required],
          supplier: [item.supplier || ''],
          unit_cost: [item.unit_cost || '', [Validators.required, Validators.min(0)]],
          purpose_remarks: [item.purpose_remarks || ''],
        })
      );
    });
  }

  get editedItems(): FormArray {
    return this.form.get('edited_items') as FormArray;
  }

  removeItem(index: number): void {
    this.editedItems.removeAt(index);
  }

  calculateTotal(index: number): string {
    const item = this.editedItems.at(index);
    const qty = item.get('quantity')?.value || 0;
    const cost = item.get('unit_cost')?.value || 0;
    const costNum = typeof cost === 'string' ? parseFloat(cost) || 0 : cost;
    return (qty * costNum).toFixed(2);
  }

  submit(): void {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please check all required fields',
      });
      return;
    }

    const formValue = this.form.value;
    const payload = {
      rf_number: this.data.requisition.rf_number,
      edited_items: formValue.edited_items,
      it_response_notes: formValue.it_response_notes,
    };

    this.loading = true;
    this.warehouseService.resubmitRequisition(this.data.requisition.rf_number, payload).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Resubmitted',
          text: `Requisition ${this.data.requisition.rf_number} has been resubmitted with edits`,
          timer: 2000,
          showConfirmButton: false,
        });
        this.dialogRef.close({ success: true });
      },
      error: (err) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Failed to resubmit requisition',
        });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
