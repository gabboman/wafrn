import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ViewBlogComponent } from './view-blog.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DeferModule } from 'primeng/defer';
import { PostModule } from '../post/post.module';



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
    ProgressSpinnerModule,
    CardModule,
    ButtonModule,
    DeferModule,
    PostModule
  ]
})
export class ViewBlogModule { }
