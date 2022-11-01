import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Follower } from 'src/app/interfaces/follower';
import { Reblog } from 'src/app/interfaces/reblog';
import { JwtService } from 'src/app/services/jwt.service';
import { LoginService } from 'src/app/services/login.service';
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
  notifications!: { follows: Follower[]; reblogs: Reblog[]; mentions: Reblog[] };
  baseMediaUrl = environment.baseMediaUrl;
  numberNotifications = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private loginService: LoginService,


  ) {
    this.loginService.logingEventEmitter.subscribe( async (ev: string) => {
      await this.updateNotifications();
    });
  }

  async ngOnInit(): Promise<void> {


    this.checkMenu({
      url: '/' + this.activatedRoute.snapshot.url.toString(),
      urlAfterRedirects: '',
      id: -1,
      type: 1,
    })

    this.router.events.subscribe((ev) => {
      if( ev instanceof NavigationEnd) {

        this.checkMenu(ev);

      }
    });
    if(this.jwtService.tokenValid()) {
      await this.updateNotifications();
    }
  }

  checkMenu(ev: NavigationEnd) {
    this.badgeVisible = ['/', '/register', '/recoverPassword'].indexOf(ev.url) === -1 && this.jwtService.tokenValid() ;
  }

  async readNotifications() {
    this.buttonReadNotificationsClickable = false;
    await this.notificationsService.markNotificationsRead();
    await this.updateNotifications();
    this.buttonReadNotificationsClickable = true;
    this.modalVisible = false;
  }

  notificationsBadgeClick() {
    this.modalVisible = true;
  }

  async updateNotifications() {
    this.notifications = await this.notificationsService.getNotifications();
    this.numberNotifications = (this.notifications.follows.length + this.notifications.reblogs.length + this.notifications.mentions.length).toString();
  }

}
