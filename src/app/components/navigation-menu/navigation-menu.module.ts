import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationMenuComponent } from './navigation-menu.component';
import { PostEditorModule } from '../post-editor/post-editor.module';
import { ReportPostModule } from '../report-post/report-post.module';
import { RouterModule } from '@angular/router';
import { DeletePostModule } from '../delete-post/delete-post.module';



@NgModule({
  declarations: [
    NavigationMenuComponent
  ],
  imports: [
    CommonModule,
    PostEditorModule,
    ReportPostModule,
    RouterModule,
    DeletePostModule,
  ],
  exports: [
    NavigationMenuComponent
  ]
})
export class NavigationMenuModule { }
