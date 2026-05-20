import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { RepairLogService } from '../services/repair-log.service';
import { TicketService } from '../services/ticket.service';
import { AuthService } from '../services/auth.service';
import { RepairLog } from '../models/repair-log.model';
import { Ticket } from '../models/ticket.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatSelectModule,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  filterForm: FormGroup;
  loading = false;
  repairLogs: RepairLog[] = [];
  tickets: Ticket[] = [];
  filteredRepairLogs: RepairLog[] = [];
  filteredTickets: Ticket[] = [];
  logoBase64 = '';

  // Table columns
  repairLogColumns = [
    'ticket_id',
    'ticket_subject',
    'asset_tag',
    'employee_name',
    'priority',
    'status',
    'requested_date',
    'completed_date',
    'total_days',
  ];

  ticketColumns = [
    'ticket_id',
    'subject',
    'category',
    'priority',
    'status',
    'created_at',
    'resolved_at',
  ];

  selectedReport = 'repair_logs';
  includeAllData = true;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private repairLogService: RepairLogService,
    private ticketService: TicketService,
    public authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.filterForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
  }

  private get pdfMake(): any {
    return (window as any).pdfMake;
  }

  ngOnInit(): void {
    // Check if admin
    if (!this.authService.isAdmin()) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only administrators can access reports.',
      }).then(() => {
        window.history.back();
      });
      return;
    }

    // Load logo
    this.loadLogo();

    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    this.filterForm.patchValue({
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    });

    this.loadReports();
  }

  private loadLogo(): void {
    this.http.get('/logoo.png', { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.logoBase64 = reader.result as string;
        };
        reader.readAsDataURL(blob);
      },
      error: (err) => {
        console.error('Error loading logo:', err);
      },
    });
  }

  loadReports(): void {
    this.loading = true;
    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;

    if (!startDate || !endDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Date Range Required',
        text: 'Please select both start and end dates.',
      });
      this.loading = false;
      return;
    }

    // Convert to ISO date strings for API
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];

    // Load both repair logs and tickets
    Promise.all([
      this.loadRepairLogs(start, end),
      this.loadTickets(start, end),
    ])
      .then(() => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Reports Loaded',
          text: `Repair Logs: ${this.filteredRepairLogs.length} | Tickets: ${this.filteredTickets.length}`,
          timer: 2000,
          showConfirmButton: false,
        });
      })
      .catch((error) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error Loading Reports',
          text: 'Failed to load report data. Please try again.',
        });
      });
  }

  private loadRepairLogs(startDate: string, endDate: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.repairLogService.getRepairLogs().subscribe({
        next: (logs) => {
          // Filter by date range based on requested_date
          this.filteredRepairLogs = logs.filter((log) => {
            if (!log.requested_date) return false;
            const logDate = new Date(log.requested_date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            // Set end date to end of day
            end.setHours(23, 59, 59, 999);
            // Compare in local timezone
            return logDate.getTime() >= start.getTime() && logDate.getTime() <= end.getTime();
          });
          resolve();
        },
        error: (err) => {
          console.error('Error loading repair logs:', err);
          reject(err);
        },
      });
    });
  }

  private loadTickets(startDate: string, endDate: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ticketService.getAllTickets().subscribe({
        next: (tickets) => {
          // Filter by date range based on created_at
          this.filteredTickets = tickets.filter((ticket) => {
            if (!ticket.created_at) return false;
            const ticketDate = new Date(ticket.created_at);
            const start = new Date(startDate);
            const end = new Date(endDate);
            // Set end date to end of day
            end.setHours(23, 59, 59, 999);
            // Compare in local timezone
            return ticketDate.getTime() >= start.getTime() && ticketDate.getTime() <= end.getTime();
          });
          resolve();
        },
        error: (err) => {
          console.error('Error loading tickets:', err);
          reject(err);
        },
      });
    });
  }

  downloadPDF(): void {
    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;

    if (!startDate || !endDate) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please ensure dates are selected.',
      });
      return;
    }

    if (this.selectedReport === 'repair_logs') {
      this.generateRepairLogsPDF(startDate, endDate);
    } else if (this.selectedReport === 'tickets') {
      this.generateTicketsPDF(startDate, endDate);
    } else {
      this.generateComprehensiveReport(startDate, endDate);
    }
  }

  private generateRepairLogsPDF(startDate: string, endDate: string): void {
    const headers = [
      'Ticket ID',
      'Subject',
      'Asset',
      'Employee',
      'Priority',
      'Status',
      'Requested',
      'Completed',
      'Days',
    ];

    const tableData = [
      headers.map((h) => ({
        text: h,
        bold: true,
        color: '#ffffff',
        fillColor: '#1976d2',
        alignment: 'center',
        margin: [4, 6, 4, 6],
        fontSize: 10,
      })),
      ...this.filteredRepairLogs.map((log, index) => [
        {
          text: log.ticket_id.toString(),
          margin: [4, 5, 4, 5],
          fontSize: 9,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: log.ticket_subject || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: log.asset_tag || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: log.employee_name || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: log.priority || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
          bold: true,
        },
        {
          text: log.status || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: this.formatDate(new Date(log.requested_date)),
          margin: [4, 5, 4, 5],
          fontSize: 9,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: log.completed_date ? this.formatDate(new Date(log.completed_date)) : 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: log.total_days?.toString() || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
          bold: true,
        },
      ]),
    ];

    const docDefinition: any = {
      content: [
        ...(this.logoBase64 ? [{
          image: this.logoBase64,
          width: 60,
          height: 60,
          alignment: 'center',
          margin: [0, 0, 0, 10],
        }] : []),
        {
          text: 'IT Help Desk',
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 5],
        },
        {
          text: 'Repair & Maintenance Logs Report',
          style: 'header',
          alignment: 'center',
        },
        {
          text: `Date Range: ${startDate} to ${endDate}`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        {
          text: `Total Records: ${this.filteredRepairLogs.length}`,
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: [
              'auto',
              '*',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
            ],
            body: tableData,
          },
          layout: 'lightHorizontalLines',
        },
        {
          text: '',
          margin: [0, 20, 0, 0],
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
              ],
              [
                {
                  text: 'Signature',
                  alignment: 'center',
                  fontSize: 10,
                },
                {
                  text: 'Signature',
                  alignment: 'center',
                  fontSize: 10,
                },
              ],
              [
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
              ],
              [
                {
                  text: 'Name/Date',
                  alignment: 'center',
                  fontSize: 10,
                },
                {
                  text: 'Name/Date',
                  alignment: 'center',
                  fontSize: 10,
                },
              ],
            ],
          },
          layout: 'noBorders',
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          italics: true,
        },
      },
      pageOrientation: 'landscape',
      pageMargins: [40, 40, 40, 40],
    };

    try {
      if (!this.pdfMake) {
        throw new Error('pdfMake library not initialized');
      }
      this.pdfMake.createPdf(docDefinition).download(`repair-logs-${startDate}-to-${endDate}.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
      Swal.fire({
        icon: 'error',
        title: 'PDF Error',
        text: 'Failed to generate PDF. Please try again.',
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'PDF Downloaded',
      text: 'Report downloaded successfully!',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  private generateTicketsPDF(startDate: string, endDate: string): void {
    const headers = ['Ticket ID', 'Subject', 'Category', 'Priority', 'Status', 'Created', 'Resolved'];

    const tableData = [
      headers.map((h) => ({
        text: h,
        bold: true,
        color: '#ffffff',
        fillColor: '#1976d2',
        alignment: 'center',
        margin: [4, 6, 4, 6],
        fontSize: 10,
      })),
      ...this.filteredTickets.map((ticket, index) => [
        {
          text: ticket.ticket_id.toString(),
          margin: [4, 5, 4, 5],
          fontSize: 9,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: ticket.subject || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: ticket.category || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: ticket.priority || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
          bold: true,
        },
        {
          text: ticket.status || 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: this.formatDate(new Date(ticket.created_at)),
          margin: [4, 5, 4, 5],
          fontSize: 9,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
        {
          text: ticket.resolved_at ? this.formatDate(new Date(ticket.resolved_at)) : 'N/A',
          margin: [4, 5, 4, 5],
          fontSize: 9,
          alignment: 'center',
          fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
        },
      ]),
    ];

    const docDefinition: any = {
      content: [
        ...(this.logoBase64 ? [{
          image: this.logoBase64,
          width: 60,
          height: 60,
          alignment: 'center',
          margin: [0, 0, 0, 10],
        }] : []),
        {
          text: 'IT Help Desk',
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 5],
        },
        {
          text: 'Tickets Report',
          style: 'header',
          alignment: 'center',
        },
        {
          text: `Date Range: ${startDate} to ${endDate}`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        {
          text: `Total Records: ${this.filteredTickets.length}`,
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: tableData,
          },
          layout: 'lightHorizontalLines',
        },
        {
          text: '',
          margin: [0, 20, 0, 0],
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
              ],
              [
                {
                  text: 'Signature',
                  alignment: 'center',
                  fontSize: 10,
                },
                {
                  text: 'Signature',
                  alignment: 'center',
                  fontSize: 10,
                },
              ],
              [
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
              ],
              [
                {
                  text: 'Name/Date',
                  alignment: 'center',
                  fontSize: 10,
                },
                {
                  text: 'Name/Date',
                  alignment: 'center',
                  fontSize: 10,
                },
              ],
            ],
          },
          layout: 'noBorders',
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          italics: true,
        },
      },
      pageOrientation: 'landscape',
      pageMargins: [40, 40, 40, 40],
    };

    try {
      if (!this.pdfMake) {
        throw new Error('pdfMake library not initialized');
      }
      this.pdfMake.createPdf(docDefinition).download(`tickets-${startDate}-to-${endDate}.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
      Swal.fire({
        icon: 'error',
        title: 'PDF Error',
        text: 'Failed to generate PDF. Please try again.',
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'PDF Downloaded',
      text: 'Report downloaded successfully!',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  private generateComprehensiveReport(startDate: string, endDate: string): void {
    const docDefinition: any = {
      content: [
        ...(this.logoBase64 ? [{
          image: this.logoBase64,
          width: 60,
          height: 60,
          alignment: 'center',
          margin: [0, 0, 0, 10],
        }] : []),
        {
          text: 'IT Help Desk',
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 5],
        },
        {
          text: 'Comprehensive Report',
          style: 'header',
          alignment: 'center',
        },
        {
          text: `Date Range: ${startDate} to ${endDate}`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        {
          text: 'Repair & Maintenance Logs',
          style: 'sectionHeader',
          margin: [0, 20, 0, 10],
        },
        {
          text: `Total Records: ${this.filteredRepairLogs.length}`,
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: [
              'auto',
              '*',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
            ],
            body: [
              [
                'Ticket ID',
                'Subject',
                'Asset',
                'Employee',
                'Priority',
                'Status',
                'Requested',
                'Completed',
                'Days',
              ].map((h) => ({
                text: h,
                bold: true,
                color: '#ffffff',
                fillColor: '#1976d2',
                alignment: 'center',
                margin: [4, 6, 4, 6],
                fontSize: 10,
              })),
              ...this.filteredRepairLogs.slice(0, 50).map((log, index) => [
                {
                  text: log.ticket_id.toString(),
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: log.ticket_subject || 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: log.asset_tag || 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  alignment: 'center',
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: log.employee_name || 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: log.priority || 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  alignment: 'center',
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                  bold: true,
                },
                {
                  text: log.status || 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  alignment: 'center',
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: this.formatDate(new Date(log.requested_date)),
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  alignment: 'center',
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: log.completed_date ? this.formatDate(new Date(log.completed_date)) : 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  alignment: 'center',
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: log.total_days?.toString() || 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  alignment: 'center',
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                  bold: true,
                },
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
        {
          text: 'Tickets',
          style: 'sectionHeader',
          margin: [0, 20, 0, 10],
          pageBreak: 'before',
        },
        {
          text: `Total Records: ${this.filteredTickets.length}`,
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              ['Ticket ID', 'Subject', 'Category', 'Priority', 'Status', 'Created', 'Resolved'].map((h) => ({
                text: h,
                bold: true,
                color: '#ffffff',
                fillColor: '#1976d2',
                alignment: 'center',
                margin: [4, 6, 4, 6],
                fontSize: 10,
              })),
              ...this.filteredTickets.slice(0, 50).map((ticket, index) => [
                {
                  text: ticket.ticket_id.toString(),
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: ticket.subject || 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: ticket.category || 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  alignment: 'center',
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: ticket.priority || 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  alignment: 'center',
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                  bold: true,
                },
                {
                  text: ticket.status || 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  alignment: 'center',
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: this.formatDate(new Date(ticket.created_at)),
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  alignment: 'center',
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
                {
                  text: ticket.resolved_at ? this.formatDate(new Date(ticket.resolved_at)) : 'N/A',
                  margin: [4, 5, 4, 5],
                  fontSize: 9,
                  alignment: 'center',
                  fillColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                },
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
        {
          text: '',
          margin: [0, 20, 0, 0],
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
              ],
              [
                {
                  text: 'Signature',
                  alignment: 'center',
                  fontSize: 10,
                },
                {
                  text: 'Signature',
                  alignment: 'center',
                  fontSize: 10,
                },
              ],
              [
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
                {
                  text: '___________________________',
                  alignment: 'center',
                  margin: [0, 10, 0, 0],
                },
              ],
              [
                {
                  text: 'Name/Date',
                  alignment: 'center',
                  fontSize: 10,
                },
                {
                  text: 'Name/Date',
                  alignment: 'center',
                  fontSize: 10,
                },
              ],
            ],
          },
          layout: 'noBorders',
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          italics: true,
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
        },
      },
      pageOrientation: 'landscape',
      pageMargins: [40, 40, 40, 40],
    };

    try {
      if (!this.pdfMake) {
        throw new Error('pdfMake library not initialized');
      }
      this.pdfMake.createPdf(docDefinition).download(`comprehensive-report-${startDate}-to-${endDate}.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
      Swal.fire({
        icon: 'error',
        title: 'PDF Error',
        text: 'Failed to generate PDF. Please try again.',
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'PDF Downloaded',
      text: 'Comprehensive report downloaded successfully!',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  applyFilters(): void {
    this.loadReports();
  }

  clearFilters(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    this.filterForm.patchValue({
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    });

    this.loadReports();
  }
}
