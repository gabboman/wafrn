import { Component, OnInit } from '@angular/core';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { NotificationType } from 'src/app/enums/notification-type';
import { Follower } from 'src/app/interfaces/follower';
import { Reblog } from 'src/app/interfaces/reblog';
import { UserNotifications } from 'src/app/interfaces/user-notifications';
import { NotificationsService } from 'src/app/services/notifications.service';
import { ThemeService } from 'src/app/services/theme.service';
import { environment } from 'src/environments/environment';

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
          this.page++;
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
    const element = document.querySelector(
      '.load-more-notifications-intersector'
    );
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
    let processedNotifications: UserNotifications[] = this.follows.map(
      (follow) => {
        return {
          type: NotificationType.FOLLOW,
          url: `/blog/${follow.url}`,
          avatar: follow.url.startsWith('@')
            ? environment.externalCacheurl + encodeURIComponent(follow.avatar)
            : environment.externalCacheurl +
            encodeURIComponent(environment.baseMediaUrl + follow.avatar),
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
    processedNotifications = processedNotifications.concat(this.emojiReacts);
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
    processedNotifications.sort((b, a) => a.date.getTime() - b.date.getTime());
    if (page === 0) {
      processedNotifications.forEach((elem) =>
        this.notificationsToShow.push(elem)
      );
    } else {
      const notSeenNotifications = processedNotifications.slice(
        this.seen.total + 1
      );
      this.notificationsToShow.splice(this.seen.total + 1);
      notSeenNotifications.forEach((elem) => {
        this.notificationsToShow.push(elem);
      });
    }
    if (element) {
      // TODO fix this?
      //this.observer.observe(element);
    }
  }

  async countViewedNotifications(index: number) {
    let loadMore = false;
    this.seen.total = this.seen.total + 1;
    switch (this.notificationsToShow[index].type) {
      case NotificationType.FOLLOW:
        this.seen.follows = this.seen.follows + 1;
        loadMore = loadMore || this.follows.length - this.seen.follows === 3;
        break;
      case NotificationType.LIKE:
        this.seen.likes = this.seen.likes + 1;
        loadMore = loadMore || this.likes.length - this.seen.likes === 3;
        break;
      case NotificationType.MENTION:
        this.seen.mentions = this.seen.mentions + 1;
        loadMore = loadMore || this.mentions.length - this.seen.mentions === 3;
        break;
      case NotificationType.REBLOG:
        this.seen.reblogs = this.seen.reblogs + 1;
        loadMore = loadMore || this.reblogs.length - this.seen.reblogs === 3;
        break;
      default:
        break;
    }

    if (loadMore) {
      this.page = this.page + 1;
      await this.loadNotifications(this.page);
    }
  }

  reblogToNotification(
    reblog: Reblog,
    type: NotificationType
  ): UserNotifications {
    if (!reblog.user) {
      console.log(`ERROR WITH ${type}`)
    }
    return {
      url: `/post/${reblog.id}`,
      avatar: reblog.user.url.startsWith('@')
        ? environment.externalCacheurl + encodeURIComponent(reblog.user.avatar)
        : environment.externalCacheurl +
        encodeURIComponent(environment.baseMediaUrl + reblog.user.avatar),
      date: reblog.createdAt,
      type: type,
      userUrl: reblog.user.url,
    };
  }
}
