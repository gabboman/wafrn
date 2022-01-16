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
  visible = false;


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


  checkMenu(ev: NavigationEnd) {
    this.visible = ['/', '/register', '/recoverPassword'].indexOf(ev.url) === -1;

    if(this.jwtService.tokenValid()) {

      this.menuItems = [
        {
          label: 'Home',
          icon: "pi pi-home",
          routerLink: '/dashboard'
        },
        {
          label: 'Write',
          icon: "pi pi-pencil",
          command: () => this.editorService.launchPostEditorEmitter.next('NEW_POST')
        },
        {
          label: 'explore',
          icon: "pi pi-compass",
          routerLink: '/dashboard/explore'
        },
        {
          label: 'Search',
          icon: "pi pi-search",
          routerLink: '/dashboard/search'
        },
        {
          label: 'My blog',
          icon: "pi pi-user",
          routerLink: '/blog/' + this.jwtService.getTokenData()['url']
        },
        {
          label: 'Profile',
          icon: "pi pi-cog",
          disabled: true
        },
        {
          label: 'Log out',
          icon: 'pi pi-sign-out',
          command: () => {localStorage.clear(); this.router.navigate(['/'])}
        }
      ];

    } else {
      this.menuItems = [
        {
          label: 'Home',
          icon: "pi pi-home",
          routerLink: '/'
        },
        {
          label: 'Search',
          icon: "pi pi-search",
          routerLink: '/dashboard/search'
        }
      ];
    }
  }

}
