import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { RouterModule, Routes } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { DeferModule } from 'primeng/defer';
import { PostModule } from 'src/app/components/post/post.module';
import { loginRequiredGuard } from 'src/app/guards/login-required.guard';

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
    ProgressSpinnerModule,
    CardModule,
    DeferModule,
    PostModule,
  ]
})
export class DashboardModule { }
