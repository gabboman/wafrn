import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { RouterModule, Routes } from '@angular/router';
import { PostModule } from 'src/app/components/post/post.module';
import { loginRequiredGuard } from 'src/app/guards/login-required.guard';
import { DeferModule } from 'src/app/directives/defer/defer.module';

const routes: Routes = [
      {
        path: '',
        component: DashboardComponent,
        canActivate: [loginRequiredGuard],

      },
      {
        path: 'explore',
        component: DashboardComponent,
        canActivate: [loginRequiredGuard]
      },
      {
        path: 'exploreLocal',
        component: DashboardComponent
      },
      {
        path: 'private',
        component: DashboardComponent,
        canActivate: [loginRequiredGuard]
      }
    ];

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DeferModule,
    PostModule,
  ]
})
export class DashboardModule { }
