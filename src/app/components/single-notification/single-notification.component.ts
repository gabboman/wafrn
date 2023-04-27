import { Component, Input } from '@angular/core';
import { NotificationType } from 'src/app/enums/notification-type';
import { UserNotifications } from 'src/app/interfaces/user-notifications';

@Component({
  selector: 'app-single-notification',
  templateUrl: './single-notification.component.html',
  styleUrls: ['./single-notification.component.scss']
})
export class SingleNotificationComponent {

  @Input() notification?: UserNotifications;
  notificationType = NotificationType;
}
