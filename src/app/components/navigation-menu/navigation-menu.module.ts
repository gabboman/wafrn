import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationMenuComponent } from './navigation-menu.component';
import { SidebarModule } from 'primeng/sidebar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ButtonModule } from 'primeng/button';
import { PostEditorModule } from '../post-editor/post-editor.module';
import { ReportPostModule } from '../report-post/report-post.module';
import { RouterModule } from '@angular/router';
import { DeletePostModule } from '../delete-post/delete-post.module';
import { BadgeModule } from 'primeng/badge';



@NgModule({
  declarations: [
    NavigationMenuComponent
  ],
  imports: [
    CommonModule,
    SidebarModule,
    PanelMenuModule,
    ButtonModule,
    PostEditorModule,
    ReportPostModule,
    RouterModule,
    DeletePostModule,
    BadgeModule,
  ],
  exports: [
    NavigationMenuComponent
  ]
})
export class NavigationMenuModule { }
