import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { EditorService } from 'src/app/services/editor.service';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
  selector: 'app-navigation-menu',
  templateUrl: './navigation-menu.component.html',
  styleUrls: ['./navigation-menu.component.scss']
})
export class NavigationMenuComponent implements OnInit {


  menuItems: MenuItem[] = [];
  buttonVisible = false;
  menuVisible = false;


  constructor(
    private editorService: EditorService,
    private router: Router,
    private jwtService: JwtService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    
    this.router.events.subscribe((ev) => {
      if( ev instanceof NavigationEnd) {

        this.checkMenu(ev);


      }
    });

    this.checkMenu({
      url: '/' + this.activatedRoute.snapshot.url.toString(),
      urlAfterRedirects: '',
      id: -1
    })

  }

  showMenu() {
    this.menuVisible = true;
  }
  hideMenu() {
    this.menuVisible = false;
  }


  checkMenu(ev: NavigationEnd) {
    this.buttonVisible = ['/', '/register', '/recoverPassword'].indexOf(ev.url) === -1;

    if(this.jwtService.tokenValid()) {

      this.menuItems = [
        {
          label: 'Dashboard',
          icon: "pi pi-home",
          command: () => this.hideMenu(),
          routerLink: '/dashboard'
        },
        {
          label: 'Write new post',
          icon: "pi pi-pencil",
          command: () => this.editorService.launchPostEditorEmitter.next('NEW_POST')
        },
        {
          label: 'Explore',
          icon: "pi pi-compass",
          command: () => this.hideMenu(),
          routerLink: '/dashboard/explore'
        },
        {
          label: 'Search',
          icon: "pi pi-search",
          command: () => this.hideMenu(),
          routerLink: '/dashboard/search'
        },
        {
          label: 'My blog',
          icon: "pi pi-user",
          command: () => this.hideMenu(),
          routerLink: ['/blog', this.jwtService.getTokenData()['url']]
        },
        {
          label: 'Edit profile [in progress]',
          icon: "pi pi-cog",
          disabled: true
        },
        {
          label: 'Log out',
          icon: 'pi pi-sign-out',
          command: () => {localStorage.clear(); this.router.navigate(['/']); this.hideMenu();}
        }
      ];

    } else {
      this.menuItems = [
        {
          label: 'Log in',
          icon: "pi pi-home",
          command: () => this.hideMenu(),
          routerLink: '/'
        },
        {
          label: 'Register',
          icon: "pi pi-user",
          command: () => this.hideMenu(),
          routerLink: '/'
        },
        {
          label: 'Search a blog!',
          icon: "pi pi-search",
          command: () => this.hideMenu(),
          routerLink: '/dashboard/search'
        }
      ];
    }
  }

}
