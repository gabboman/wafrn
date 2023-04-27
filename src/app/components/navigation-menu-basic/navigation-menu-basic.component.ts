import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-navigation-menu-basic',
  templateUrl: './navigation-menu-basic.component.html',
  styleUrls: ['./navigation-menu-basic.component.scss']
})
export class NavigationMenuBasicComponent implements OnInit {

  buttonVisible = true;
  menuVisible = false;
  menuItems: MenuItem[] = [
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
      routerLink: '/register'
    },
    {
      label: 'Explore without an account',
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
      label: 'Privacy policy',
      title: 'Privacy policy',
      icon: "pi pi-eye-slash",
      command: () => this.hideMenu(),
      routerLink: '/privacy'
    },
    {
      label: 'Check the source code!',
      title: 'The frontend is made in angular, you can check the code here',
      icon: "pi pi-code",
      target: "_blank",
      url: "https://github.com/gabboman/wafrn"
    },
    {
      label: "Give us some money",
      title: "Give us some money through patreon",
      icon: 'pi pi-euro',
      target: "_blank",
      url: "https://patreon.com/wafrn"
    }
  ];
  constructor() { }

  ngOnInit(): void {
  }

  showMenu() {
    this.menuVisible = true;
  }

  hideMenu() {
    this.menuVisible = false;
  }

}
