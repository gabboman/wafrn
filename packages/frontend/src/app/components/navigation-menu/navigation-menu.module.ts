import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { MatBadgeModule } from '@angular/material/badge'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatListModule } from '@angular/material/list'
import { MatSidenavModule } from '@angular/material/sidenav'
import { RouterModule } from '@angular/router'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { ColorSchemeSwitcherComponent } from '../color-scheme-switcher/color-scheme-switcher.component'
import { MenuItemComponent } from '../menu-item/menu-item.component'
import { SnappyOutletDirective } from '../snappy/snappy-router.component'
import { NavigationMenuComponent } from './navigation-menu.component'

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
    ColorSchemeSwitcherComponent,
    SnappyOutletDirective
  ],
  exports: [NavigationMenuComponent]
})
export class NavigationMenuModule { }
