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
      id: -1,
      type: 1
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
          title: 'View dashboard',
          icon: "pi pi-home",
          command: () => this.hideMenu(),
          routerLink: '/dashboard'
        },
        {
          label: 'Write new post',
          title: 'Write a post',
          icon: "pi pi-pencil",
          command: () => {this.editorService.launchPostEditorEmitter.next('NEW_POST'); this.hideMenu();}
        },
        {
          label: 'Explore',
          icon: "pi pi-compass",
          title: 'See ALL the posts that are public! not only the ones of people you follow!',
          command: () => this.hideMenu(),
          routerLink: '/dashboard/explore'
        },
        {
          label: 'Search',
          title: 'search',
          icon: "pi pi-search",
          command: () => this.hideMenu(),
          routerLink: '/dashboard/search'
        },
        {
          label: 'My blog',
          title: 'View your own blog',
          icon: "pi pi-user",
          command: () => this.hideMenu(),
          routerLink: ['/blog', this.jwtService.getTokenData()['url']]
        },
        {
          label: 'Edit profile',
          title: 'Edit profile',
          icon: "pi pi-cog",
          routerLink: ['/editProfile']
        },
        {
          label: 'Check the source code!',
          icon: "pi pi-code",
          title: 'The frontend is made in angular, you can check the code here',
          target: "_blank",
          url: "https://github.com/gabboman/wafrn"
        },
        {
          label: 'Log out',
          icon: 'pi pi-sign-out',
          title: 'nintendo this button is for you, and your 25000000 alt accounts',
          command: () => {localStorage.clear(); this.router.navigate(['/']); this.hideMenu();}
        }
      ];

    } else {
      this.menuItems = [
        {
          label: 'Log in',
          title: 'Log in',
          icon: "pi pi-home",
          command: () => this.hideMenu(),
          routerLink: '/'
        },
        {
          label: 'Register',
          title: 'Register',
          icon: "pi pi-user",
          command: () => this.hideMenu(),
          routerLink: '/'
        },
        {
          label: 'Explore',
          icon: "pi pi-compass",
          title: 'See ALL the posts that are public! Yes, you can be a lurker',
          command: () => this.hideMenu(),
          routerLink: '/dashboard/explore'
        },
        {
          label: 'Search a blog!',
          title: 'Search',
          icon: "pi pi-search",
          command: () => this.hideMenu(),
          routerLink: '/dashboard/search'
        },
        {
          label: 'Check the source code!',
          title: 'The frontend is made in angular, you can check the code here',
          icon: "pi pi-code",
          target: "_blank",
          url: "https://github.com/gabboman/wafrn"
        }
      ];
    }
  }

}
