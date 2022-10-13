import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewBlogComponent } from './view-blog/view-blog.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedWafrnModule } from '../sharedWafrn/shared-wafrn.module';



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
    SharedWafrnModule,
  ]
})
export class ViewBlogModule { }
