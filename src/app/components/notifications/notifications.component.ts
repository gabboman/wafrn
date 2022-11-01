import { Component, OnInit } from '@angular/core';
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
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private loginService: LoginService,


  ) {
    this.loginService.logingEventEmitter.subscribe( async (ev: string) => {
      await this.updateNotifications();
    });
  }

  async ngOnInit(): Promise<void> {
    if(this.jwtService.tokenValid()) {
      await this.updateNotifications();
    }
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
    this.badgeVisible = this.numberNotifications != '0';
  }

}
