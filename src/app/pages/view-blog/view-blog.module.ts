import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ViewBlogComponent } from './view-blog.component';
import { PostModule } from '../../components/post/post.module';
import { PagenotfoundModule } from '../pagenotfound/pagenotfound.module';
import { DeferModule } from 'src/app/directives/defer/defer.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatMenuModule } from '@angular/material/menu';

const routes: Routes = [
  {
    path: ':url',
    component: ViewBlogComponent,
  },
];

@NgModule({
  declarations: [ViewBlogComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DeferModule,
    PostModule,
    PagenotfoundModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    FontAwesomeModule,
    MatMenuModule,
  ],
})
export class ViewBlogModule {}
