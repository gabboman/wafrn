import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ViewBlogComponent } from './view-blog.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DeferModule } from 'primeng/defer';
import { PostModule } from '../../components/post/post.module';
import { NavigationMenuModule } from 'src/app/components/navigation-menu/navigation-menu.module';
import { NavigationMenuComponent } from 'src/app/components/navigation-menu/navigation-menu.component';



const routes: Routes = [
  {
    path: '',
    component: NavigationMenuComponent,
    children: [
      {
        path: ':url',
        component: ViewBlogComponent
      }
    ]
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
    PostModule,
    NavigationMenuModule
  ]
})
export class ViewBlogModule { }
