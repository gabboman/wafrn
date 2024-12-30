import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NavigationMenuComponent } from './navigation-menu.component'
import { RouterModule } from '@angular/router'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatListModule } from '@angular/material/list'
import { MenuItemComponent } from '../menu-item/menu-item.component'
import { MatBadgeModule } from '@angular/material/badge'
import { MatButtonModule } from '@angular/material/button'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { MatDialogModule } from '@angular/material/dialog'
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component'

@NgModule({
  declarations: [NavigationMenuComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MenuItemComponent,
    MatBadgeModule,
    FontAwesomeModule,
    MatButtonModule,
    MatDialogModule,
    ThemeSwitcherComponent
  ],
  exports: [NavigationMenuComponent]
})
export class NavigationMenuModule {}
