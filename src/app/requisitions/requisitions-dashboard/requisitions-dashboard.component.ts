import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateRequisitionFormComponent } from '../create-requisition-form/create-requisition-form.component';
import { MyRequisitionsListComponent } from '../my-requisitions-list/my-requisitions-list.component';

@Component({
  selector: 'app-requisitions-dashboard',
  standalone: true,
  imports: [CommonModule, CreateRequisitionFormComponent, MyRequisitionsListComponent],
  template: `
    <div class="requisitions-dashboard">
      <div class="dashboard-header">
        <h1>Requisitions Management</h1>
        <p class="subtitle">Create and track part requisitions</p>
      </div>

      <div class="dashboard-content">
        <!-- Create Requisition Form -->
        <section class="form-section">
          <app-create-requisition-form (submitSuccess)="onFormSubmitted($event)"></app-create-requisition-form>
        </section>

        <!-- My Requisitions List -->
        <section class="list-section">
          <app-my-requisitions-list [refreshTrigger]="refreshTrigger"></app-my-requisitions-list>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .requisitions-dashboard {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;

      .dashboard-header {
        text-align: center;
        margin-bottom: 3rem;

        h1 {
          font-size: 2rem;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .subtitle {
          font-size: 1rem;
          color: #999;
          margin: 0.5rem 0 0 0;
        }
      }

      .dashboard-content {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;

        .form-section {
          order: 1;
        }

        .list-section {
          order: 2;
        }
      }
    }

    @media (max-width: 768px) {
      .requisitions-dashboard {
        padding: 1rem;

        .dashboard-header {
          margin-bottom: 2rem;

          h1 {
            font-size: 1.5rem;
          }

          .subtitle {
            font-size: 0.9rem;
          }
        }

        .dashboard-content {
          gap: 1.5rem;
        }
      }
    }
  `],
})
export class RequisitionsDashboardComponent {
  refreshTrigger = 0;

  onFormSubmitted(rfNumber: string): void {
    this.refreshTrigger++;
  }
}
