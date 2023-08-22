import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { Action } from 'src/app/interfaces/editor-launcher-data';
import { AdminService } from 'src/app/services/admin.service';
import { EditorService } from 'src/app/services/editor.service';
import { JwtService } from 'src/app/services/jwt.service';
import { LoginService } from 'src/app/services/login.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-navigation-menu',
  templateUrl: './navigation-menu.component.html',
  styleUrls: ['./navigation-menu.component.scss']
})
export class NavigationMenuComponent implements OnInit, OnDestroy {


  menuItems: MenuItem[] = [];
  menuVisible = true;
  notifications = 0;
  adminNotifications = 0;
  privateMessagesNotifications = '';
  mobile = false;
  logo = environment.logo;

  navigationSubscription: Subscription;
  loginSubscription: Subscription;
  constructor(
    private editorService: EditorService,
    private router: Router,
    private jwtService: JwtService,
    private loginService: LoginService,
    private notificationsService: NotificationsService,
    private cdr: ChangeDetectorRef,
    private adminService: AdminService
  ) {
    this.loginSubscription = this.loginService.logingEventEmitter.subscribe(() => {
      this.drawMenu();
    })
    this.navigationSubscription = this.router.events.subscribe((ev) => {
      if( ev instanceof NavigationEnd) {
        this.updateNotifications(ev.url)
      }
    });

  }


  ngOnInit(): void {
    this.drawMenu();
    this.onResize();
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
    this.loginSubscription.unsubscribe();
  }

  showMenu() {
    this.menuVisible = true;
  }

  hideMenu() {
    this.menuVisible = false;
    this.editorService.launchPostEditorEmitter.next({action: Action.Close});
  }


  drawMenu() {
    this.menuItems = [
      {
        label: 'THIS ONE',
        icon: "pi pi-bell",
        title: 'Check your notifications',
        command: () => this.hideMenu(),
        routerLink: '/dashboard/notifications',
        badge: "3",// this.notifications === 0 ? '': this.notifications.toString(),
      }
    ];
  }

  async updateNotifications(url: string) {
    if(this.jwtService.tokenValid()) {
      if(url === '/dashboard/notifications') {
        this.notifications = 0;
      } else {
        const response = await this.notificationsService.getUnseenNotifications()
        this.notifications =  response;
      }
      this.drawMenu();
      this.cdr.detectChanges();
    }
    if (this.jwtService.adminToken()) {
      const reports = (await this.adminService.getOpenReportsCount())?.reports
      this.adminNotifications = reports;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
  this.mobile = window.innerWidth <= 992;
}

onCloseMenu () {
  this.menuVisible = false;
}

}
