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
    private dialogService: MatDialog
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
        label: 'Zaloguj się',
        icon: faHouse,
        title: 'Zaloguj się',
        visible: !this.jwtService.tokenValid(),
        routerLink: '/login',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Zarejestruj się',
        icon: faUser,
        title: 'Zarejestruj się',
        visible: !this.jwtService.tokenValid(),
        routerLink: '/',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Przeglądaj bez konta',
        icon: faCompass,
        title: 'Zobacz WSZYSTKIE posty na Gofrze, które są publiczne!',
        visible: !this.jwtService.tokenValid(),
        routerLink: '/dashboard/exploreLocal',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Lokalna oś czasu',
        icon: faHouse,
        title: 'Zobacz, co u sąsiada',
        visible: this.jwtService.tokenValid(),
        routerLink: '/dashboard',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Wstaw nowego woota',
        icon: faPencil,
        title: 'Co słychać?',
        visible: this.jwtService.tokenValid(),
        command: async () => {
          this.hideMenu()
          this.openEditor()
        }
      },
      {
        label: 'Powiadomienia',
        icon: faBell,
        title: 'Samotne kocice na twojej instancji',
        visible: this.jwtService.tokenValid(),
        badge: this.notifications,
        routerLink: '/dashboard/notifications',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Eksploruj',
        icon: faCompass,
        title: 'Zobacz, co słychać na serwerze (lub na całym Fedi)!',
        visible: this.jwtService.tokenValid(),
        items: [
          {
            label: 'Eksploruj Gofra',
            icon: faServer,
            title: 'Jak się mają koledzy z serwera?',
            visible: this.jwtService.tokenValid(),
            routerLink: '/dashboard/exploreLocal',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Eksploruj Fediwersum',
            icon: faCompass,
            title: 'Co w szerokim świecie?',
            visible: this.jwtService.tokenValid(),
            routerLink: '/dashboard/explore',
            command: () => {
              this.hideMenu()
            }
          }
        ]
      },
      {
        label: 'Archiwum X',
        icon: faQuestion,
        title: 'Pytania, na które nie odpowiedziałoś',
        visible: this.jwtService.tokenValid(),
        badge: this.awaitingAsks,
        routerLink: '/profile/myAsks',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'DMy',
        icon: faEnvelope,
        title: 'Mamy tutaj takie coś!',
        visible: this.jwtService.tokenValid(),
        routerLink: '/dashboard/private',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Kabinet Prezydenta',
        icon: faPowerOff,
        title: 'Zobacz swoje powiadomienia',
        visible: this.jwtService.adminToken(),
        badge: this.adminNotifications + this.usersAwaitingApproval,
        items: [
          {
            label: 'Lista serwerów',
            icon: faServer,
            title: 'Lista wszystkich serwerów',
            visible: true,
            routerLink: '/admin/server-list',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Dodaj emotki',
            icon: faIcons,
            title: 'Dodaj emotkę, albo dwie, Albo całą kolekcję.',
            visible: true,
            routerLink: '/admin/emojis',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Zgłoszenia',
            icon: faExclamationTriangle,
            title: 'Zobacz zgłoszenia od użytkowników',
            visible: true,
            badge: this.adminNotifications,
            routerLink: '/admin/user-reports',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Bany',
            icon: faBan,
            title: 'Bany',
            visible: true,
            routerLink: '/admin/bans',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Blokady',
            icon: faHourglass,
            title: 'Blokady',
            visible: true,
            routerLink: '/admin/user-blocks',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Statystyki',
            icon: faChartSimple,
            title: 'Tak zwane fakty i logika',
            visible: true,
            routerLink: '/admin/stats',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Użytkownicy oczekujący na wejście',
            icon: faUserLock,
            title: 'Użytkownicy czekający na wizę do Gofra',
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
        label: 'Szukaj',
        icon: faSearch,
        title: 'Szukaj',
        visible: this.jwtService.tokenValid(),
        routerLink: '/dashboard/search',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Ustawienia',
        icon: faCog,
        title: 'Profil, stylówka, i takie tam',
        visible: this.jwtService.tokenValid(),
        badge: this.followsAwaitingApproval,
        items: [
          {
            label: 'Zarządzaj śledziami',
            icon: faUser,
            title: 'Zarządzaj śledziami',
            visible: true,
            badge: this.followsAwaitingApproval,
            routerLink: '/blog/' + this.jwtService.getTokenData().url + '/followers',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Opcje profilu',
            icon: faUserEdit,
            title: 'Opcje profilu',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/edit',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Zmień stylówkę',
            icon: faPaintbrush,
            title: 'Ubierz się i oślep innych',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/css',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Zarządzaj uciszonymi użyszkodnikami',
            icon: faVolumeMute,
            title: 'Zarządzaj uciszonymi użyszkodnikami',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/mutes',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Zarządzaj wyciszonymi postami',
            icon: faBellSlash,
            title: 'Zarządzaj wyciszonymi postami',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/silencedPosts',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Zarządzaj zablokowanymi użyszkodnikami',
            icon: faBan,
            title: 'Zarządzaj zablokowanymi użyszkodnikami',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/blocks',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Zarządzaj zablokowanymi serwerami',
            icon: faServer,
            title: 'Zarządzaj zablokowanymi serwerami',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/serverBlocks',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Importuj śledzie',
            icon: faUserEdit,
            title: 'Importuj swoje śledzie',
            visible: this.jwtService.tokenValid(),
            routerLink: '/profile/importFollows',
            command: () => {
              this.hideMenu()
            }
          },
          {
            label: 'Seekretne Menu',
            icon: faSkull,
            title: 'Seekretne Menu',
            visible: this.jwtService.tokenValid(),
            routerLink: '/doom',
            command: () => {
              this.hideMenu()
            }
          }
        ]
      },
      {
        label: 'Mój blog',
        icon: faUser,
        title: 'Zobacz swojego bloga',
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
        label: 'Polityka Prywatności i Zasady',
        icon: faEyeSlash,
        title: 'Polityka Prywatności i Zasady',
        visible: true,
        routerLink: '/privacy',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Zobacz kod źródłowy!',
        icon: faCode,
        title: 'Frontend jest napisany w Angular, a backend w TypeScripcie.',
        visible: true,
        url: 'https://github.com/gabboman/wafrn',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Patreon',
        icon: faEuro,
        title: 'Wspomóż nas na Patronite',
        visible: true,
        url: 'https://patreon.com/wafrn',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Ko-fi',
        icon: faEuro,
        title: 'Wspomóż nas na Ko-Fi',
        visible: true,
        url: 'https://ko-fi.com/wafrn',
        command: () => {
          this.hideMenu()
        }
      },
      {
        label: 'Wyloguj',
        icon: faSignOut,
        title: 'Pierdolę to, dość Fedi na dziś',
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
    const nodeName = document.activeElement?.nodeName ? document.activeElement.nodeName : ''
    if (!['INPUT', 'TEXTAREA', 'DIV'].includes(nodeName) && this.jwtService.tokenValid()) {
      this.editorService.openDialogWithData(undefined)
    }
  }

  onCloseMenu() {
    this.menuVisible = false
  }
}
