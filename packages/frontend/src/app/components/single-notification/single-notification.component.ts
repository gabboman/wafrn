import { Component, Input, OnInit, SimpleChanges } from '@angular/core'
import { NotificationType } from 'src/app/enums/notification-type'
import { UserNotifications } from 'src/app/interfaces/user-notifications'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { MatCardModule } from '@angular/material/card'

import { PostFragmentComponent } from '../post-fragment/post-fragment.component'
import { PostHeaderComponent } from '../post/post-header/post-header.component'
import { EnvironmentService } from 'src/app/services/environment.service'
import { PostRibbonComponent } from '../post-ribbon/post-ribbon.component'
import { faAt, faCheck, faHeart, faQuoteLeft, faRepeat, faUser } from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'app-single-notification',
  templateUrl: './single-notification.component.html',
  styleUrls: ['./single-notification.component.scss'],
  imports: [CommonModule, RouterModule, MatCardModule, PostFragmentComponent, PostHeaderComponent, PostRibbonComponent]
  //providers: [DateTimeToRelativePipe, DateTimeFromJsDatePipe]
})
export class SingleNotificationComponent implements OnInit {
  emojiUrl: string = ''
  @Input() notification!: UserNotifications
  notificationType = NotificationType

  notificationIcons = {
    [NotificationType.MENTION]: faAt,
    [NotificationType.LIKE]: faHeart,
    [NotificationType.FOLLOW]: faUser,
    [NotificationType.REBLOG]: faRepeat,
    [NotificationType.QUOTE]: faQuoteLeft,
    [NotificationType.EMOJIREACT]: faCheck
  }

  constructor() {}

  ngOnInit(): void {
    if (this.notification.emojiReact) {
      this.emojiUrl =
        EnvironmentService.environment.externalCacheurl +
        encodeURIComponent(this.notification.emojiReact?.url as string)
    }
  }
}
