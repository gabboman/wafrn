import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons'
import { Follower } from 'src/app/interfaces/follower'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { Reblog } from 'src/app/interfaces/reblog'
import { SimplifiedUser } from 'src/app/interfaces/simplified-user'
import { UserNotifications } from 'src/app/interfaces/user-notifications'
import { NotificationsService } from 'src/app/services/notifications.service'
import { ThemeService } from 'src/app/services/theme.service'

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: false
})
export class NotificationsComponent implements OnInit {
  page = 0
  follows: Follower[] = []
  likes: Reblog[] = []
  reblogs: Reblog[] = []
  mentions: Reblog[] = []
  quotes: Reblog[] = []
  emojiReacts: UserNotifications[] = []
  observer: IntersectionObserver

  seen = {
    follows: 0,
    likes: 0,
    reblogs: 0,
    mentions: 0,
    total: 0
  }

  notificationsToShow: UserNotifications[] = []

  constructor(
    private notificationsService: NotificationsService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {
    this.themeService.setMyTheme()
    this.observer = new IntersectionObserver((intersectionEntries: IntersectionObserverEntry[]) => {
      if (intersectionEntries.some((elem) => elem.isIntersecting)) {
        this.page = this.page + 1
        this.loadNotificationsV2(this.page)
      }
    })
  }

  reload() {
    this.page = 0
    this.notificationsToShow = []
    this.ngOnInit()
  }

  async ngOnInit(): Promise<void> {
    // window.scrollTo(0, 0)
    localStorage.setItem('lastTimeCheckNotifications', new Date().toISOString())
    await this.loadNotificationsV2(0)
  }

  async loadNotificationsV2(page: number) {
    const notifications = await this.notificationsService.getNotificationsScrollV2(page)
    // this waythe whole object is not recreated from scratch
    notifications.forEach((notif) => this.notificationsToShow.push(notif))
    setTimeout(() => {
      const elements = document.querySelectorAll('.load-more-notifications-intersector')
      if (elements) {
        elements.forEach((element) => {
          this.observer.observe(element)
        })
      } else {
        console.log('observer not ready')
      }
    })
    this.cdr.detectChanges()
  }

  reblogToNotification(
    reblog: Reblog,
    type: 'MENTION' | 'LIKE' | 'EMOJIREACT' | 'REWOOT' | 'QUOTE' | 'FOLLOW'
  ): UserNotifications {
    if (!reblog.user) {
      console.log(`ERROR WITH ${type}`)
    }
    return {
      url: `/fediverse/post/${reblog.id}`,
      avatar: reblog.user.avatar,
      date: reblog.createdAt,
      type: type,
      userUrl: reblog.user.url,
      fragment: reblog.content,
      emojiName: reblog.emojiName,
      emojiReact: reblog.emojiReact,
      userName: reblog.user.name
    }
  }
}
