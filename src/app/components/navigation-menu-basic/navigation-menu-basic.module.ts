import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationMenuBasicComponent } from './navigation-menu-basic.component';
import { SidebarModule } from 'primeng/sidebar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    NavigationMenuBasicComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    SidebarModule,
    PanelMenuModule,
    RouterModule
  ]
})
export class NavigationMenuBasicModule { }
