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
  IconDefinition,
  faBookmark
} from '@fortawesome/free-solid-svg-icons'
import { MenuItem } from 'src/app/interfaces/menu-item'
import { MatDialog } from '@angular/material/dialog'
import { EnvironmentService } from 'src/app/services/environment.service'
import { faBluesky } from '@fortawesome/free-brands-svg-icons'
import { TranslateService } from '@ngx-translate/core'

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
    private translateService: TranslateService
  ) {
    this.loginSubscription = this.loginSubscription = this.loginService.loginEventEmitter.subscribe(() => {
      this.drawMenu()
    })
    if (this.loginService.getForceClassicLogo()) {
      this.logo = '/assets/classicLogo.png'
    }
    this.navigationSubscription = this.router.events.subscribe((ev) => {
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
        label: 'Log in',
        icon: faHouse,
        title: 'Log in',
        visible: !this.jwtService.tokenValid(),
        routerLink: '/login',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Register',
        icon: faUser,
        title: 'Register',
        visible: !this.jwtService.tokenValid(),
        routerLink: '/',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Explore without an account',
        icon: faCompass,
        title: 'See ALL the posts that are public! Yes, you can be a lurker',
        visible: !this.jwtService.tokenValid(),
        routerLink: '/dashboard/exploreLocal',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: this.translateService.instant('menu.dashboard'),
        icon: faHouse,
        title: this.translateService.instant('menu.dashboardHover'),
        visible: this.jwtService.tokenValid(),
        routerLink: '/dashboard',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: this.translateService.instant('menu.writeWoot'),
        icon: faPencil,
        title: this.translateService.instant('menu.writeWoot'),
        visible: this.jwtService.tokenValid(),
        command: async () => {
          this.hideMenu()
          this.openEditor()
        }
      },
      {
        label: this.translateService.instant('menu.notifications'),
        icon: faBell,
        title: this.translateService.instant('menu.notifications'),
        visible: this.jwtService.tokenValid(),
        badge: this.notifications,
        routerLink: '/dashboard/notifications',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: this.translateService.instant('menu.explore'),
        icon: faCompass,
        title: this.translateService.instant('menu.exploreDescription'),
        visible: this.jwtService.tokenValid(),
        items: [
          {
            label: this.translateService.instant('menu.exploreWafrn'),
            icon: faServer,
            title: this.translateService.instant('menu.exploreWafrnDescription'),
            visible: this.jwtService.tokenValid(),
            routerLink: '/dashboard/exploreLocal',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.exploreFediverse'),
            icon: faCompass,
            title: this.translateService.instant('menu.exploreFediverseDescription'),
            visible: this.jwtService.tokenValid(),
            routerLink: '/dashboard/explore',
            command: () => {
              this.hideMenu()
            }
          }
        ]
      },
      {
        label: this.translateService.instant('menu.unansweredAsks'),
        icon: faQuestion,
        title: this.translateService.instant('menu.unansweredAsks'),
        visible: this.jwtService.tokenValid(),
        badge: this.awaitingAsks,
        routerLink: '/profile/myAsks',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: this.translateService.instant('menu.privateMessages'),
        icon: faEnvelope,
        title: this.translateService.instant('menu.privateMessages'),
        visible: this.jwtService.tokenValid(),
        routerLink: '/dashboard/private',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: this.translateService.instant('menu.admin.title'),
        icon: faPowerOff,
        title: this.translateService.instant('menu.admin.title'),
        visible: this.jwtService.adminToken(),
        badge: this.adminNotifications + this.usersAwaitingApproval,
        items: [
          {
            label: this.translateService.instant('menu.admin.serverList'),
            icon: faServer,
            title: this.translateService.instant('menu.admin.serverList'),
            visible: true,
            routerLink: '/admin/server-list',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.admin.addEmojis'),
            icon: faIcons,
            title: this.translateService.instant('menu.admin.addEmojis'),
            visible: true,
            routerLink: '/admin/emojis',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.admin.reports'),
            icon: faExclamationTriangle,
            title: this.translateService.instant('menu.admin.reports'),
            visible: true,
            badge: this.adminNotifications,
            routerLink: '/admin/user-reports',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.admin.bans'),
            icon: faBan,
            title: this.translateService.instant('menu.admin.bans'),
            visible: true,
            routerLink: '/admin/bans',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.admin.blocklist'),
            icon: faHourglass,
            title: this.translateService.instant('menu.admin.blocklist'),
            visible: true,
            routerLink: '/admin/user-blocks',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.admin.stats'),
            icon: faChartSimple,
            title: this.translateService.instant('menu.admin.stats'),
            visible: true,
            routerLink: '/admin/stats',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.admin.awaitingAproval'),
            icon: faUserLock,
            title: this.translateService.instant('menu.admin.awaitingAproval'),
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
        label: this.translateService.instant('menu.search'),
        icon: faSearch,
        title: this.translateService.instant('menu.search'),
        visible: this.jwtService.tokenValid(),
        routerLink: '/dashboard/search',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: this.translateService.instant('menu.settings.title'),
        icon: faCog,
        title: this.translateService.instant('menu.settings.title'),
        visible: this.jwtService.tokenValid(),
        badge: this.followsAwaitingApproval,
        items: [
          {
            label: this.translateService.instant('menu.settings.follows'),
            icon: faUser,
            title: this.translateService.instant('menu.settings.follows'),
            visible: true,
            badge: this.followsAwaitingApproval,
            routerLink: '/blog/' + this.jwtService.getTokenData().url + '/followers',
            command: () => {
              this.hideMenu()
            }
          },
          // {
          //   label: this.translateService.instant('menu.settings.enableBluesky'),
          //   icon: faBluesky,
          //   title: this.translateService.instant('menu.settings.enableBluesky'),
          //   visible: true,
          //   routerLink: '/profile/enable-bluesky',
          //   command: () => {
          //     this.hideMenu()
          //   }
          // },
          {
            label: this.translateService.instant('menu.settings.editProfile'),
            icon: faUserEdit,
            title: this.translateService.instant('menu.settings.editProfile'),
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/edit',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.settings.themeEditor'),
            icon: faPaintbrush,
            title: this.translateService.instant('menu.settings.themeEditor'),
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/css',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.settings.mutedUsers'),
            icon: faVolumeMute,
            title: this.translateService.instant('menu.settings.mutedUsers'),
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/mutes',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.settings.mutedPosts'),
            icon: faBellSlash,
            title: this.translateService.instant('menu.settings.mutedPosts'),
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/silencedPosts',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.settings.bookmarkedPosts'),
            icon: faBookmark,
            title: this.translateService.instant('menu.settings.bookmarkedPosts'),
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/bookmarkedPosts',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.settings.myBlockedUsers'),
            icon: faBan,
            title: this.translateService.instant('menu.settings.myBlockedUsers'),
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/blocks',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.settings.myBlockedServers'),
            icon: faServer,
            title: this.translateService.instant('menu.settings.myBlockedServers'),
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/serverBlocks',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.settings.importFollows'),
            icon: faUserEdit,
            title: this.translateService.instant('menu.settings.importFollows'),
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/importFollows',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: this.translateService.instant('menu.settings.superSecretMenu'),
            icon: faSkull,
            title: this.translateService.instant('menu.settings.superSecretMenu'),
            visible: this.jwtService.tokenValid(),
            routerLink: '/doom',
            command: () => {
              this.hideMenu()
            }
          }
        ]
      },
      {
        label: this.translateService.instant('menu.myBlog'),
        icon: faUser,
        title: this.translateService.instant('menu.myBlog'),
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
        label: this.translateService.instant('menu.privacy'),
        icon: faEyeSlash,
        title: this.translateService.instant('menu.privacy'),
        visible: true,
        routerLink: '/about',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: this.translateService.instant('menu.faq'),
        icon: faQuestion,
        title: this.translateService.instant('menu.faq'),
        visible: true,
        url: 'https://wafrn.net/faq/overview.html',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: this.translateService.instant('menu.source'),
        icon: faCode,
        title: this.translateService.instant('menu.source'),
        visible: true,
        url: 'https://github.com/gabboman/wafrn',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: this.translateService.instant('menu.patreon'),
        icon: faEuro,
        title: this.translateService.instant('menu.patreon'),
        visible: true,
        url: 'https://patreon.com/wafrn',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: this.translateService.instant('menu.kofi'),
        icon: faEuro,
        title: this.translateService.instant('menu.kofi'),
        visible: true,
        url: 'https://ko-fi.com/wafrn',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: this.translateService.instant('menu.logout'),
        icon: faSignOut,
        title: this.translateService.instant('menu.logout'),
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
    this.menuVisible = !this.mobile
  }

  @HostListener('window:keydown.n')
  @HostListener('window:keydown.p')
  async openEditor() {
    const nodeName = document.activeElement?.nodeName ? document.activeElement.nodeName : ''
    if (!['INPUT', 'TEXTAREA', 'DIV'].includes(nodeName) && this.jwtService.tokenValid()) {
      this.editorService.openDialogWithData(undefined)
    }
  }

  onCloseMenu() {
    this.menuVisible = false
  }
}
