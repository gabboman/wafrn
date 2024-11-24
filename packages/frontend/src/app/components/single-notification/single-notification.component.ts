import { Component, Input, OnInit } from '@angular/core';
import { NotificationType } from 'src/app/enums/notification-type';
import { UserNotifications } from 'src/app/interfaces/user-notifications';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

import { PostFragmentComponent } from '../post-fragment/post-fragment.component';
import { MatButton } from '@angular/material/button';
import { AvatarSmallComponent } from "../avatar-small/avatar-small.component";
import { PostHeaderComponent } from "../post/post-header/post-header.component";
import { EnvironmentService } from 'src/app/services/environment.service';

@Component({
  selector: 'app-single-notification',
  templateUrl: './single-notification.component.html',
  styleUrls: ['./single-notification.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    PostFragmentComponent,
    PostHeaderComponent,
    AvatarSmallComponent
  ]
})
export class SingleNotificationComponent implements OnInit {
  emojiUrl: string = '';
  @Input() notification!: UserNotifications;
  notificationType = NotificationType;

  ngOnInit(): void {
    if (this.notification.emojiReact) {
      this.emojiUrl =
        EnvironmentService.environment.externalCacheurl +
        encodeURIComponent(this.notification.emojiReact?.url as string);
    }


  }
}
