import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EmployeeService } from '../../services/employee.service';
import { Branch } from '../../models/employee.model';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss'],
})
export class BranchListComponent implements OnInit {
  branches: Branch[] = [];
  displayedColumns: string[] = ['name', 'address', 'phone', 'email', 'actions'];
  loading = true;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.loading = true;
    this.employeeService.getBranches().subscribe({
      next: (data) => {
        this.branches = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load branches:', err);
        this.loading = false;
      },
    });
  }
}
