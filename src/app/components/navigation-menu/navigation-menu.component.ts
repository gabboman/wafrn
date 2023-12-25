import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Action } from 'src/app/interfaces/editor-launcher-data';
import { AdminService } from 'src/app/services/admin.service';
import { DashboardService } from 'src/app/services/dashboard.service';
import { EditorService } from 'src/app/services/editor.service';
import { JwtService } from 'src/app/services/jwt.service';
import { LoginService } from 'src/app/services/login.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { environment } from 'src/environments/environment';
import { faQuestion, faHouse, faUser, faCompass, faPencil, faBell, faPowerOff, faServer, faExclamationTriangle, faBan, faEnvelope, faSearch, faUserEdit, faVolumeOff, faVolumeMute, faEyeSlash, faCode, faEuro, faSignOut } from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'app-navigation-menu',
  templateUrl: './navigation-menu.component.html',
  styleUrls: ['./navigation-menu.component.scss']
})
export class NavigationMenuComponent implements OnInit, OnDestroy {


  menuItems: any[] = [];
  menuVisible = false;
  notifications = 0;
  adminNotifications = 0;
  privateMessagesNotifications = '';
  mobile = false;
  logo = environment.logo;
  defaultIcon = faQuestion
  navigationSubscription: Subscription;
  loginSubscription: Subscription;
  constructor(
    private editorService: EditorService,
    private router: Router,
    private jwtService: JwtService,
    private loginService: LoginService,
    private notificationsService: NotificationsService,
    private cdr: ChangeDetectorRef,
    private adminService: AdminService,
    private dashboardService: DashboardService
  ) {
    this.loginSubscription = this.loginService.loginEventEmitter.subscribe(() => {
      this.drawMenu();
    })
    this.navigationSubscription = this.router.events.subscribe((ev) => {
      if( ev instanceof NavigationEnd) {
        this.updateNotifications(ev.url)
      }
    });

    this.dashboardService.scrollEventEmitter.subscribe(ev => {
      this.updateNotifications('scroll')
    })

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
        label: 'Log in',
        title: 'Log in',
        icon: faHouse,
        command: () => this.hideMenu(),
        routerLink: '/login',
        visible: !this.jwtService.tokenValid()
      },
      {
        label: 'Register',
        title: 'Register',
        icon: faUser,
        command: () => this.hideMenu(),
        routerLink: '/',
        visible: !this.jwtService.tokenValid()
      },
      {
        label: 'Explore without an account',
        icon: faCompass,
        title: 'See ALL the posts that are public! Yes, you can be a lurker',
        command: () => this.hideMenu(),
        routerLink: '/dashboard/exploreLocal',
        visible: !this.jwtService.tokenValid()
      },
      {
        label: 'Dashboard',
        title: 'View dashboard',
        icon: faHouse,
        command: () => this.hideMenu(),
        routerLink: '/dashboard',
        visible: this.jwtService.tokenValid()
      },
      {
        label: 'Write new post',
        title: 'Write a post',
        icon: faPencil,
        command: () => {this.editorService.launchPostEditorEmitter.next({action: Action.New}); this.menuVisible = false;},
        visible: this.jwtService.tokenValid()
      },
      {
        label: 'Notifications',
        icon: faBell,
        title: 'Check your notifications',
        command: () => this.hideMenu(),
        routerLink: '/dashboard/notifications',
        badge: this.notifications === 0 ? '': this.notifications.toString(),
        visible: this.jwtService.tokenValid()
      },
      {
        label: 'Admin',
        icon: faPowerOff,
        title: 'Check your notifications',
        badge: this.adminNotifications === 0 ? '' : this.adminNotifications.toString(),
        visible: this.jwtService.adminToken(),
        items: [
          {
            label: 'Server list',
            icon: faServer,
            title: 'List of all the servers',
            command: () => this.hideMenu(),
            routerLink: '/admin/server-list',
          },
          {
            label: 'User reports',
            title: 'User reports',
            icon: faExclamationTriangle,
            badge: this.adminNotifications === 0 ? '' : this.adminNotifications.toString(),
            command: () => this.hideMenu(),
            routerLink: '/admin/user-reports',
          },
          {
            label: 'User bans',
            title: 'User bans',
            icon: faBan,
            command: () => this.hideMenu(),
            routerLink: '/admin/bans',
          },
          {
            label: 'User blocklists',
            title: 'User blocklists',
            command: () => this.hideMenu(),
            routerLink: '/admin/user-blocks',
          }
        ]
      },
      {
        label: 'Explore',
        title: 'See the local posts of the server or the fediverse!',
        visible: this.jwtService.tokenValid(),
        items: [
          {
            label: 'Local explore',
            icon: faServer,
            title: 'See the local posts of the server!',
            command: () => this.hideMenu(),
            routerLink: '/dashboard/exploreLocal',
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Explore the fediverse',
            icon: faCompass,
            title: 'Take a look to all the public posts avaiable to us, not only of people in this servers',
            command: () => this.hideMenu(),
            routerLink: '/dashboard/explore',
            visible: this.jwtService.tokenValid()
          }
        ]
      },

      {
        label: 'Private messages',
        icon: faEnvelope,
        title: 'Private messages are here!',
        command: () => this.hideMenu(),
        routerLink: '/dashboard/private',
        visible: this.jwtService.tokenValid()
      },
      {
        label: 'Search',
        title: 'Search',
        icon: faSearch,
        command: () => this.hideMenu(),
        routerLink: '/dashboard/search'
      },

      {
        label: 'Settings',
        title: 'Your blog, your profile, blocks, and other stuff',
        visible: this.jwtService.tokenValid(),
        items: [
          {
            label: 'Edit profile',
            title: 'Edit profile',
            icon: faUserEdit,
            command: () => this.hideMenu(),
            routerLink: ['/profile/edit'],
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Edit my theme',
            title: 'Edit my theme',
            icon: faUserEdit,
            command: () => this.hideMenu(),
            routerLink: ['/profile/css'],
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Manage muted users',
            title: 'Manage muted users',
            icon: faVolumeMute,
            command: () => this.hideMenu(),
            routerLink: ['/profile/mutes'],
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Manage blocked users',
            title: 'Manage blocked users',
            icon: faBan,
            command: () => this.hideMenu(),
            routerLink: ['/profile/blocks'],
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Manage blocked servers',
            title: 'Manage blocked servers',
            icon: faServer,
            command: () => this.hideMenu(),
            routerLink: ['/profile/serverBlocks'],
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'My blog',
            title: 'View your own blog',
            icon: faUser,
            command: () => this.hideMenu(),
            routerLink: ['/blog', this.jwtService.tokenValid() ? this.jwtService.getTokenData()['url'] : ''],
            visible: this.jwtService.tokenValid()
          },
        ]
      },
      {
        label: 'Privacy policy',
        title: 'Privacy policy',
        icon: faEyeSlash,
        command: () => this.hideMenu(),
        routerLink: '/privacy'
      },
      {
        label: 'Check the source code!',
        icon: faCode,
        title: 'The frontend is made in angular, you can check the code here',
        target: "_blank",
        url: "https://github.com/gabboman/wafrn"
      },
      {
        label: "Give us some money",
        title: "Give us some money through patreon",
        icon: faEuro,
        target: "_blank",
        url: "https://patreon.com/wafrn"
      },
      {
        label: 'Log out',
        icon: faSignOut,
        title: 'nintendo this button is for you, and your 25000000 alt accounts',
        command: () => {this.loginService.logOut(); this.hideMenu();},
        visible: this.jwtService.tokenValid()
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
