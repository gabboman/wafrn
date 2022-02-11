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

    await this.updateNotifications();
    if(this.jwtService.tokenValid()) {
      // TODO 
      // This would create some inconsistencies when user joins in for the first time!
      // Maybe add an event to onuserlogin or something like that
      // its not like a major bug
      // but it can create a "one in a million" annoyance
      // and we all know that one in a million posibility happends one of every 5 times as a programmer
      setTimeout(async () => {
        await this.updateNotifications();
      }, 300000);
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
    this.numberNotifications = (this.notifications.follows.length + this.notifications.reblogs.length).toString();
  }

}
