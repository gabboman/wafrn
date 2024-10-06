import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';
import { AdminService } from 'src/app/services/admin.service';
import { EnvironmentService } from 'src/app/services/environment.service';


@Component({
  selector: 'app-pending-users',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule],
  templateUrl: './pending-users.component.html',
  styleUrl: './pending-users.component.scss',
})
export class PendingUsersComponent {
  pendingUsers: SimplifiedUser[] = [];

  constructor(private adminService: AdminService) {
    this.reloadList();
  }

  async activateUser(id: string) {
    await this.adminService.activateUser(id);
    this.reloadList();
  }

  async requireExtra(id: string) {
    await this.adminService.requireExtraSteps(id);
    this.reloadList();
  }

  reloadList() {
    this.pendingUsers = [];
    this.adminService.getPendingActivationUsers().then((response) => {
      this.pendingUsers = response.map((elem) => {
        elem.avatar = EnvironmentService.environment.baseMediaUrl + elem.avatar;
        return elem;
      });
    });
  }
}
