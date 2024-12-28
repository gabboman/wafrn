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
import {
  faCheck,
  faHeart,
  faQuoteLeft,
  faRepeat,
  faReply,
  faShareNodes,
  faUser
} from '@fortawesome/free-solid-svg-icons'
import { DateTimeFromJsDatePipe, DateTimeToRelativePipe, LuxonModule } from 'luxon-angular'

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
    PostRibbonComponent,
    LuxonModule
  ],
  providers: [DateTimeToRelativePipe, DateTimeFromJsDatePipe]
})
export class SingleNotificationComponent implements OnInit {
  emojiUrl: string = ''
  @Input() notification!: UserNotifications
  notificationType = NotificationType
  timeAgo = ''

  notificationIcons = {
    [NotificationType.MENTION]: faShareNodes,
    [NotificationType.LIKE]: faHeart,
    [NotificationType.FOLLOW]: faUser,
    [NotificationType.REBLOG]: faRepeat,
    [NotificationType.QUOTE]: faQuoteLeft,
    [NotificationType.EMOJIREACT]: faCheck
  }

  // Icons
  shareIcon = faShareNodes
  solidHeartIcon = faHeart
  replyIcon = faReply
  reblogIcon = faRepeat
  quoteIcon = faQuoteLeft
  userIcon = faUser
  checkIcon = faCheck

  constructor(
    private dateTimeToRelative: DateTimeToRelativePipe,
    private dateTimeFromJsDatePipe: DateTimeFromJsDatePipe
  ) {}

  ngOnInit(): void {
    if (this.notification.emojiReact) {
      this.emojiUrl =
        EnvironmentService.environment.externalCacheurl +
        encodeURIComponent(this.notification.emojiReact?.url as string)
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.timeAgo = this.dateTimeToRelative.transform(
      this.dateTimeFromJsDatePipe.transform(this.notification.date),
      // TODO unhardcode locale
      { style: 'long', locale: 'en' }
    )
  }
}
