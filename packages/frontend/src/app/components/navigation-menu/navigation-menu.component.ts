import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { Action } from 'src/app/interfaces/editor-launcher-data'
import { AdminService } from 'src/app/services/admin.service'
import { DashboardService } from 'src/app/services/dashboard.service'
import { EditorService } from 'src/app/services/editor.service'
import { JwtService } from 'src/app/services/jwt.service'
import { LoginService } from 'src/app/services/login.service'
import { NotificationsService } from 'src/app/services/notifications.service'

import {
  faQuestion,
  faHouse,
  faUser,
  faCompass,
  faPencil,
  faBell,
  faPowerOff,
  faServer,
  faExclamationTriangle,
  faBan,
  faEnvelope,
  faSearch,
  faUserEdit,
  faVolumeMute,
  faEyeSlash,
  faCode,
  faEuro,
  faSignOut,
  faBars,
  faUserLock,
  faCog,
  faChartSimple,
  faHourglass,
  faBellSlash,
  faIcons,
  faSkull,
  faFileEdit,
  faPaintbrush,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons'
import { MenuItem } from 'src/app/interfaces/menu-item'
import { MatDialog } from '@angular/material/dialog'
import { EnvironmentService } from 'src/app/services/environment.service'
import { MessageService } from 'src/app/services/message.service'

@Component({
  selector: 'app-navigation-menu',
  templateUrl: './navigation-menu.component.html',
  styleUrls: ['./navigation-menu.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None
})
export class NavigationMenuComponent implements OnInit, OnDestroy {
  menuItems: MenuItem[] = []
  maintenanceMode = EnvironmentService.environment.maintenance
  maintenanceMessage = EnvironmentService.environment.maintenanceMessage
  menuVisible = false
  notifications = 0
  adminNotifications = 0
  usersAwaitingApproval = 0
  followsAwaitingApproval = 0
  awaitingAsks = 0
  privateMessagesNotifications = ''
  mobile = false
  logo = EnvironmentService.environment.logo
  defaultIcon = faQuestion
  navigationSubscription: Subscription
  loginSubscription: Subscription
  scrollSubscription: Subscription
  hamburguerIcon = faBars
  pencilIcon = faPencil
  currentRoute = ''
  constructor(
    private editorService: EditorService,
    private router: Router,
    public jwtService: JwtService,
    private loginService: LoginService,
    private notificationsService: NotificationsService,
    private cdr: ChangeDetectorRef,
    private adminService: AdminService,
    private dashboardService: DashboardService,
    private dialogService: MatDialog,
    private messageService: MessageService
  ) {
    this.loginSubscription = this.loginSubscription = this.loginService.loginEventEmitter.subscribe(() => {
      this.drawMenu()
    })
    if (this.loginService.getForceClassicLogo()) {
      this.logo = '/assets/classicLogo.png'
    }
    this.navigationSubscription = this.router.events.subscribe((ev) => {
      scroll(0, 0)
      if (ev instanceof NavigationEnd) {
        this.currentRoute = ev.url
        this.updateNotifications(ev.url)
      }
    })

    this.scrollSubscription = this.dashboardService.scrollEventEmitter.subscribe(() => {
      this.updateNotifications('scroll')
    })
  }

  ngOnInit(): void {
    this.drawMenu()
    this.onResize()
    this.menuVisible = !this.mobile

    // IMPORTANT: HIDE THE SPLASH SCREEN
    const splashElement = document.getElementById('splash')
    splashElement?.classList.add('loaded')
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe()
    this.loginSubscription.unsubscribe()
    this.scrollSubscription.unsubscribe()
  }

  showMenu() {
    this.menuVisible = true
  }

  hideMenu() {
    this.menuVisible = false
    this.editorService.launchPostEditorEmitter.next({ action: Action.Close })
  }

  drawMenu() {
    this.menuItems = [
      {
        label: 'Bread in',
        icon: faHouse,
        title: 'Bread in',
        visible: !this.jwtService.tokenValid(),
        routerLink: '/login',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Join the bread cult',
        icon: faUser,
        title: 'Join the bread cult',
        visible: !this.jwtService.tokenValid(),
        routerLink: '/',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Bread without an account',
        icon: faCompass,
        title: 'See the breads that are public',
        visible: !this.jwtService.tokenValid(),
        routerLink: '/dashboard/exploreLocal',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Bread',
        icon: faHouse,
        title: 'View bread',
        visible: this.jwtService.tokenValid(),
        routerLink: '/dashboard',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Post bread',
        icon: faPencil,
        title: 'Post bread',
        visible: this.jwtService.tokenValid(),
        command: async () => {
          this.hideMenu()
          this.openEditor()
        }
      },
      {
        label: 'Breadifications',
        icon: faBell,
        title: 'Check your bread',
        visible: this.jwtService.tokenValid(),
        badge: this.notifications,
        routerLink: '/dashboard/notifications',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Bread',
        icon: faCompass,
        title: 'bread',
        visible: this.jwtService.tokenValid(),
        items: [
          {
            label: 'Explore bread',
            icon: faServer,
            title: 'Bread',
            visible: this.jwtService.tokenValid(),
            routerLink: '/dashboard/exploreLocal',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Explore the breadiverse',
            icon: faCompass,
            title: 'Take a look to all bread',
            visible: this.jwtService.tokenValid(),
            routerLink: '/dashboard/explore',
            command: () => {
              this.hideMenu()
            }
          }
        ]
      },
      {
        label: 'Unanswered bread',
        icon: faQuestion,
        title: 'Unanswered bread',
        visible: this.jwtService.tokenValid(),
        badge: this.awaitingAsks,
        routerLink: '/profile/myAsks',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Private bread',
        icon: faEnvelope,
        title: 'Private bread is here!',
        visible: this.jwtService.tokenValid(),
        routerLink: '/dashboard/private',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Admin',
        icon: faPowerOff,
        title: 'Check your notifications',
        visible: this.jwtService.adminToken(),
        badge: this.adminNotifications + this.usersAwaitingApproval,
        items: [
          {
            label: 'Server list',
            icon: faServer,
            title: 'List of all the servers',
            visible: true,
            routerLink: '/admin/server-list',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Add emojis',
            icon: faIcons,
            title: 'Add emoji collection',
            visible: true,
            routerLink: '/admin/emojis',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'User reports',
            icon: faExclamationTriangle,
            title: 'User reports',
            visible: true,
            badge: this.adminNotifications,
            routerLink: '/admin/user-reports',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'User bans',
            icon: faBan,
            title: 'User bans',
            visible: true,
            routerLink: '/admin/bans',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'User blocklists',
            icon: faHourglass,
            title: 'User blocklists',
            visible: true,
            routerLink: '/admin/user-blocks',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Stats',
            icon: faChartSimple,
            title: 'Stats',
            visible: true,
            routerLink: '/admin/stats',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Users awaiting approval',
            icon: faUserLock,
            title: 'User awaiting approval',
            visible: true,
            badge: this.usersAwaitingApproval,
            routerLink: '/admin/activate-users',
            command: () => {
              this.hideMenu()
            }
          }
        ]
      },
      {
        label: 'Search bread',
        icon: faSearch,
        title: 'Search bread',
        visible: this.jwtService.tokenValid(),
        routerLink: '/dashboard/search',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Bread settings',
        icon: faCog,
        title: 'Your blog, your bread, blocks, and other stuff',
        visible: this.jwtService.tokenValid(),
        badge: this.followsAwaitingApproval,
        items: [
          {
            label: 'Manage bread',
            icon: faUser,
            title: 'Manage bread',
            visible: true,
            badge: this.followsAwaitingApproval,
            routerLink: '/blog/' + this.jwtService.getTokenData().url + '/followers',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Profile bread',
            icon: faUserEdit,
            title: 'Profile bread',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/edit',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Edit my bread',
            icon: faPaintbrush,
            title: 'Edit my bread',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/css',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Manage muted bread',
            icon: faVolumeMute,
            title: 'Manage muted bread',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/mutes',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Manage muted bread',
            icon: faBellSlash,
            title: 'Manage muted bread',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/silencedPosts',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Manage blocked breads',
            icon: faBan,
            title: 'Manage blocked breads',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/blocks',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Manage blocked breads',
            icon: faServer,
            title: 'Manage blocked breads',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/serverBlocks',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Import breads',
            icon: faUserEdit,
            title: 'Import breads',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/importFollows',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Special secret bread',
            icon: faSkull,
            title: 'Special secret bread',
            visible: this.jwtService.tokenValid(),
            routerLink: '/doom',
            command: () => {
              this.hideMenu()
            }
          }
        ]
      },
      {
        label: 'My bread',
        icon: faUser,
        title: 'View your own bread',
        visible: this.jwtService.tokenValid(),
        routerLink: '/blog/' + (this.jwtService.tokenValid() ? this.jwtService.getTokenData()['url'] : ''),
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: '',
        title: '',
        visible: true,
        divider: true
      },
      {
        label: 'bread',
        icon: faEyeSlash,
        title: 'bread',
        visible: true,
        routerLink: '/privacy',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Check the bread!',
        icon: faCode,
        title: 'bread',
        visible: true,
        url: 'https://github.com/gabboman/wafrn',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Pay for bread',
        icon: faEuro,
        title: 'Give us some money through patreon',
        visible: true,
        url: 'https://patreon.com/wafrn',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Pay for bread',
        icon: faEuro,
        title: 'Give us some money through ko-fi',
        visible: true,
        url: 'https://ko-fi.com/wafrn',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Bread out',
        icon: faSignOut,
        title: 'nintendo this button is for you, and your 25000000 alt accounts',
        visible: this.jwtService.tokenValid(),
        command: () => {
          this.loginService.logOut()
          this.hideMenu()
        }
      }
    ]
  }

  async updateNotifications(url: string) {
    if (this.jwtService.tokenValid()) {
      const response = await this.notificationsService.getUnseenNotifications()
      if (url === '/dashboard/notifications') {
        this.notifications = 0
      } else {
        this.notifications = response.notifications
      }
      this.adminNotifications = response.reports
      this.usersAwaitingApproval = response.usersAwaitingApproval
      this.followsAwaitingApproval = response.followsAwaitingApproval
      this.awaitingAsks = response.asks
      this.drawMenu()
      this.cdr.detectChanges()
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.mobile = window.innerWidth <= 992
  }

  @HostListener('window:keydown.n')
  @HostListener('window:keydown.p')
  async openEditor() {
    await this.editorService.createPost({
      content: 'Bread',
      privacy: 0,
      media: []
    })
    this.messageService.add({
      severity: 'success',
      summary: 'bread'
    })
  }

  onCloseMenu() {
    this.menuVisible = false
  }
}
