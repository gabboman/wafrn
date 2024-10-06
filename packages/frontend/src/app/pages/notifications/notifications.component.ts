import { Component, OnInit } from '@angular/core';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { NotificationType } from 'src/app/enums/notification-type';
import { Follower } from 'src/app/interfaces/follower';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { Reblog } from 'src/app/interfaces/reblog';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';
import { UserNotifications } from 'src/app/interfaces/user-notifications';
import { NotificationsService } from 'src/app/services/notifications.service';
import { ThemeService } from 'src/app/services/theme.service';


@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  page = 0;
  follows: Follower[] = [];
  likes: Reblog[] = [];
  reblogs: Reblog[] = [];
  mentions: Reblog[] = [];
  quotes: Reblog[] = []
  emojiReacts: UserNotifications[] = [];
  observer: IntersectionObserver;
  reloadIcon = faArrowsRotate;

  seen = {
    follows: 0,
    likes: 0,
    reblogs: 0,
    mentions: 0,
    total: 0,
  };

  notificationsToShow: UserNotifications[] = [];

  constructor(
    private notificationsService: NotificationsService,
    private themeService: ThemeService
  ) {
    this.themeService.setMyTheme();
    this.observer = new IntersectionObserver(
      (intersectionEntries: IntersectionObserverEntry[]) => {
        if (intersectionEntries.some((elem) => elem.isIntersecting)) {
          this.page = this.page + 1;
          this.loadNotifications(this.page);
        }
      }
    );
  }

  reload() {
    this.page = 0;
    this.ngOnInit();
  }

  async ngOnInit(): Promise<void> {
    window.scrollTo(0, 0);
    localStorage.setItem(
      'lastTimeCheckNotifications',
      new Date().toISOString()
    );
    await this.loadNotifications(0);
  }

  async loadNotifications(page: number) {
    this.observer.disconnect();
    if (page === 0) {
      this.likes = [];
      this.follows = [];
      this.reblogs = [];
      this.mentions = [];
      this.emojiReacts = [];

      this.notificationsToShow = [];
      this.seen = {
        follows: 0,
        likes: 0,
        reblogs: 0,
        mentions: 0,
        total: 0,
      };
    }
    const allNotifications =
      await this.notificationsService.getNotificationsScroll(page);
    this.follows = this.follows.concat(allNotifications.follows);
    this.mentions = this.mentions.concat(allNotifications.mentions);
    this.reblogs = this.reblogs.concat(allNotifications.reblogs);
    this.emojiReacts = this.emojiReacts.concat(allNotifications.emojiReactions);
    this.likes = this.likes.concat(allNotifications.likes);
    this.quotes = this.quotes.concat(allNotifications.quotes);
    let processedNotifications: UserNotifications[] = this.follows.map(
      (follow) => {
        return {
          type: NotificationType.FOLLOW,
          url: `/blog/${follow.url}`,
          avatar: follow.avatar,
          date: follow.createdAt,
          userUrl: follow.url,
        };
      }
    );
    processedNotifications = processedNotifications.concat(
      this.mentions.map((elem) =>
        this.reblogToNotification(elem, NotificationType.MENTION)
      )
    );
    processedNotifications = processedNotifications.concat(this.emojiReacts.map(elem => this.reblogToNotification({
      id: elem.url,
      user: {
        id: elem.userUrl,
        url: elem.userUrl,
        name: elem.userUrl,
        avatar: elem.avatar
      },
      content: elem.fragment as ProcessedPost,
      createdAt: elem.date,
      emojiName: elem.emojiName,
      emojiReact: elem.emojiReact
    }, NotificationType.EMOJIREACT)));
    processedNotifications = processedNotifications.concat(
      this.reblogs.map((elem) =>
        this.reblogToNotification(elem, NotificationType.REBLOG)
      )
    );
    processedNotifications = processedNotifications.concat(
      this.likes.map((elem) =>
        this.reblogToNotification(elem, NotificationType.LIKE)
      )
    );
    processedNotifications = processedNotifications.concat(this.quotes.map((elem) => this.reblogToNotification(elem, NotificationType.QUOTE)))
    processedNotifications.sort((b, a) => a.date.getTime() - b.date.getTime());
    if (page === 0) {
      processedNotifications.forEach((elem) =>
        this.notificationsToShow.push(elem)
      );
    } else {
      const notSeenNotifications = processedNotifications.slice(
        this.page * 20 + 1
      );
      this.notificationsToShow.splice(this.page * 20 + 1);
      notSeenNotifications.forEach((elem) => {
        this.notificationsToShow.push(elem);
      });
    }
    setTimeout(() => {
      const elements = document.querySelectorAll(
        '.load-more-notifications-intersector'
      );
      if (elements) {
        //this.observer.observe(element);
        elements.forEach(element => {
          this.observer.observe(element)
        })
      } else {
        console.log('observer not ready')
      }
    })

  }

  reblogToNotification(
    reblog: Reblog,
    type: NotificationType
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
      emojiReact: reblog.emojiReact
    };
  }
}
