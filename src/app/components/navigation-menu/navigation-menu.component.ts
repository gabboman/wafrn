import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { Action } from 'src/app/interfaces/editor-launcher-data';
import { EditorService } from 'src/app/services/editor.service';
import { JwtService } from 'src/app/services/jwt.service';
import { LoginService } from 'src/app/services/login.service';
import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-navigation-menu',
  templateUrl: './navigation-menu.component.html',
  styleUrls: ['./navigation-menu.component.scss']
})
export class NavigationMenuComponent implements OnInit, OnDestroy {


  menuItems: MenuItem[] = [];
  menuVisible = false;
  notifications = '';
  mobile = false;

  navigationSubscription: Subscription;
  loginSubscription: Subscription;
  constructor(
    private editorService: EditorService,
    private router: Router,
    private jwtService: JwtService,
    private loginService: LoginService,
    private notificationsService: NotificationsService,
    private cdr: ChangeDetectorRef
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
        label: 'Log in',
        title: 'Log in',
        icon: "pi pi-home",
        command: () => this.hideMenu(),
        routerLink: '/login',
        visible: !this.jwtService.tokenValid()
      },
      {
        label: 'Register',
        title: 'Register',
        icon: "pi pi-user",
        command: () => this.hideMenu(),
        routerLink: '/',
        visible: !this.jwtService.tokenValid()
      },
      {
        label: 'Explore without an account',
        icon: "pi pi-compass",
        title: 'See ALL the posts that are public! Yes, you can be a lurker',
        command: () => this.hideMenu(),
        routerLink: '/dashboard/exploreLocal',
        visible: !this.jwtService.tokenValid()
      },
      {
        label: 'Dashboard',
        title: 'View dashboard',
        icon: "pi pi-home",
        command: () => this.hideMenu(),
        routerLink: '/dashboard',
        visible: this.jwtService.tokenValid()
      },
      {
        label: 'Write new post',
        title: 'Write a post',
        icon: "pi pi-pencil",
        command: () => {this.editorService.launchPostEditorEmitter.next({action: Action.New}); this.menuVisible = false;},
        visible: this.jwtService.tokenValid()
      },
      {
        label: 'Notifications',
        icon: "pi pi-bell",
        title: 'Check your notifications',
        command: () => this.hideMenu(),
        routerLink: '/dashboard/notifications',
        badge: this.notifications,
        visible: this.jwtService.tokenValid()
      },
      {
        label: 'Admin',
        icon: "pi pi-power-off",
        title: 'Check your notifications',
        // badge: this.notifications,
        visible: this.jwtService.adminToken(),
        items: [
          {
            label: 'Server list',
            icon: "pi pi-server",
            title: 'List of all the servers',
            command: () => this.hideMenu(),
            routerLink: '/admin/server-list',
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
            icon: "pi pi-server",
            title: 'See the local posts of the server!',
            command: () => this.hideMenu(),
            routerLink: '/dashboard/exploreLocal',
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Explore the fediverse',
            icon: "pi pi-compass",
            title: 'Take a look to all the public posts avaiable to us, not only of people in this servers',
            command: () => this.hideMenu(),
            routerLink: '/dashboard/explore',
            visible: this.jwtService.tokenValid()
          }
        ]
      },

      {
        label: 'Private messages',
        icon: "pi pi-envelope",
        title: 'Private messages are here!',
        command: () => this.hideMenu(),
        routerLink: '/dashboard/private',
        visible: this.jwtService.tokenValid()
      },
      {
        label: 'Search',
        title: 'Search',
        icon: "pi pi-search",
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
            icon: "pi pi-user-edit",
            command: () => this.hideMenu(),
            routerLink: ['/profile/edit'],
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'Manage blocked users',
            title: 'Manage blocked users',
            icon: "pi pi-ban",
            command: () => this.hideMenu(),
            routerLink: ['/profile/blocks'],
            visible: this.jwtService.tokenValid(),
          },
          {
            label: 'My blog',
            title: 'View your own blog',
            icon: "pi pi-user",
            command: () => this.hideMenu(),
            routerLink: ['/blog', this.jwtService.tokenValid() ? this.jwtService.getTokenData()['url'] : ''],
            visible: this.jwtService.tokenValid()
          },
        ]
      },
      {
        label: 'Privacy policy',
        title: 'Privacy policy',
        icon: "pi pi-eye-slash",
        command: () => this.hideMenu(),
        routerLink: '/privacy'
      },
      {
        label: 'Check the source code!',
        icon: "pi pi-code",
        title: 'The frontend is made in angular, you can check the code here',
        target: "_blank",
        url: "https://github.com/gabboman/wafrn"
      },
      {
        label: "Give us some money",
        title: "Give us some money through patreon",
        icon: 'pi pi-euro',
        target: "_blank",
        url: "https://patreon.com/wafrn"
      },
      {
        label: 'Log out',
        icon: 'pi pi-sign-out',
        title: 'nintendo this button is for you, and your 25000000 alt accounts',
        command: () => {this.loginService.logOut(); this.hideMenu();},
        visible: this.jwtService.tokenValid()
      }
    ];
  }

  async updateNotifications(url: string) {
    if(this.jwtService.tokenValid()) {
      if(url === '/dashboard/notifications') {
        this.notifications = '';
      } else {
        const response = await this.notificationsService.getUnseenNotifications()
        this.notifications =  response;
      }
      this.drawMenu();
      this.cdr.detectChanges();
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
