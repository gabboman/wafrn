import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { statsReply } from 'src/app/interfaces/statsReply';
import { AdminService } from 'src/app/services/admin.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
})
export class StatsComponent {
  backendReply!: statsReply;
  constructor(private adminService: AdminService) {
    adminService.getStats().then((response) => {
      this.backendReply = response;
    });
  }
}
