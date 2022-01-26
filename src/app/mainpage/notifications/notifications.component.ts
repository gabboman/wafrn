import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Follower } from 'src/app/interfaces/follower';
import { Reblog } from 'src/app/interfaces/reblog';
import { JwtService } from 'src/app/services/jwt.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {

  badgeVisible = false;
  modalVisible = false;
  buttonReadNotificationsClickable = true;
  notifications!: { follows: Follower[]; reblogs: Reblog[]; };
  baseMediaUrl = environment.baseMediaUrl;
  numberNotifications = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private jwtService: JwtService,
    private notificationsService: NotificationsService


  ) { }

  async ngOnInit(): Promise<void> {


    this.checkMenu({
      url: '/' + this.activatedRoute.snapshot.url.toString(),
      urlAfterRedirects: '',
      id: -1
    })

    this.router.events.subscribe((ev) => {
      if( ev instanceof NavigationEnd) {

        this.checkMenu(ev);

      }
    });

    this.notifications = await this.notificationsService.getNotifications();
    this.numberNotifications = (this.notifications.follows.length + this.notifications.reblogs.length).toString();
    //console.log(notifications);
  }

  checkMenu(ev: NavigationEnd) {
    this.badgeVisible = ['/', '/register', '/recoverPassword'].indexOf(ev.url) === -1 && this.jwtService.tokenValid() ;
  }

  async readNotifications() {
    this.buttonReadNotificationsClickable = false;
    await this.notificationsService.markNotificationsRead();
    this.notifications = await this.notificationsService.getNotifications();
    this.numberNotifications = (this.notifications.follows.length + this.notifications.reblogs.length).toString();
    this.buttonReadNotificationsClickable = true;
    this.modalVisible = false;
  }

  notificationsBadgeClick() {
    this.modalVisible = true;
  }

}
