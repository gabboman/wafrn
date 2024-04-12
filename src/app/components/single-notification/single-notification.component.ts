import { Component, Input, OnInit } from '@angular/core';
import { NotificationType } from 'src/app/enums/notification-type';
import { UserNotifications } from 'src/app/interfaces/user-notifications';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { environment } from 'src/environments/environment';
import { PostFragmentComponent } from '../post-fragment/post-fragment.component';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-single-notification',
  templateUrl: './single-notification.component.html',
  styleUrls: ['./single-notification.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, PostFragmentComponent, MatButton],
})
export class SingleNotificationComponent implements OnInit {
  emojiUrl: string = '';
  @Input() notification!: UserNotifications;
  notificationType = NotificationType;
  selfAvatarUrl: string = '';

  ngOnInit(): void {
    if (this.notification.emojiReact) {
      this.emojiUrl =
        environment.externalCacheurl +
        encodeURIComponent(this.notification.emojiReact?.url as string);
    }
    if (this.notification.type != this.notificationType.FOLLOW) {
      this.selfAvatarUrl = environment.externalCacheurl + encodeURIComponent(environment.baseMediaUrl + this.notification.fragment?.user.avatar)
    }
  }
}
