import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationMenuComponent } from './navigation-menu.component';
import { RouterModule } from '@angular/router';
import { DeletePostModule } from '../delete-post/delete-post.module';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MenuItemComponent } from '../menu-item/menu-item.component';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [NavigationMenuComponent],
  imports: [
    CommonModule,
    RouterModule,
    DeletePostModule,
    MatSidenavModule,
    MatListModule,
    MenuItemComponent,
    MatBadgeModule,
    FontAwesomeModule,
    MatButtonModule,
    MatDialogModule,
  ],
  exports: [NavigationMenuComponent],
})
export class NavigationMenuModule {}
