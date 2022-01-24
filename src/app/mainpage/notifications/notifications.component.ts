import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { JwtService } from 'src/app/services/jwt.service';
import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {


  visible = false;

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

    const notifications = await this.notificationsService.getNotifications();
    console.log(notifications);
  }

  checkMenu(ev: NavigationEnd) {
    this.visible = ['/', '/register', '/recoverPassword'].indexOf(ev.url) === -1 && this.jwtService.tokenValid() ;
  }

}
