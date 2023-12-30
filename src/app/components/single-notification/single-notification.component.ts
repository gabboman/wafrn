import { Component, Input } from '@angular/core';
import { NotificationType } from 'src/app/enums/notification-type';
import { UserNotifications } from 'src/app/interfaces/user-notifications';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-single-notification',
  templateUrl: './single-notification.component.html',
  styleUrls: ['./single-notification.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule],
})
export class SingleNotificationComponent {
  @Input() notification!: UserNotifications;
  notificationType = NotificationType;
}
