import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedWafrnModule } from '../sharedWafrn/shared-wafrn.module';
import { ViewBlogComponent } from './view-blog.component';



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
    // TODO delete this resource hog
    SharedWafrnModule,
  ]
})
export class ViewBlogModule { }
