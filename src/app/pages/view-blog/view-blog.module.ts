import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ViewBlogComponent } from './view-blog.component';
import { PostModule } from '../../components/post/post.module';
import { PagenotfoundModule } from '../pagenotfound/pagenotfound.module';
import { DeferModule } from 'src/app/directives/defer/defer.module';



const routes: Routes = [
      {
        path: ':url',
        component: ViewBlogComponent
      }
    ];

@NgModule({
  declarations: [
    ViewBlogComponent
    ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DeferModule,
    PostModule,
    PagenotfoundModule,
  ]
})
export class ViewBlogModule { }
