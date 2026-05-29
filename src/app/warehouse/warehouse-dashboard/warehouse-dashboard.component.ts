import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestPartsFormComponent } from '../request-parts-form/request-parts-form.component';
import { MyPartRequestsListComponent } from '../my-part-requests-list/my-part-requests-list.component';

@Component({
  selector: 'app-warehouse-dashboard',
  standalone: true,
  imports: [CommonModule, RequestPartsFormComponent, MyPartRequestsListComponent],
  templateUrl: './warehouse-dashboard.component.html',
  styleUrls: ['./warehouse-dashboard.component.scss'],
})
export class WarehouseDashboardComponent {
  refreshTrigger = 0;

  onFormSubmitted(): void {
    this.refreshTrigger++;
  }
}
