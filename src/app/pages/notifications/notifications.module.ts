import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from './notifications.component';
import { Route, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SingleNotificationModule } from 'src/app/components/single-notification/single-notification.module';
import { DeferModule } from 'primeng/defer';
import { loginRequiredGuard } from 'src/app/guards/login-required.guard';
import { DataViewModule, DataViewLayoutOptions } from 'primeng/dataview';


const routes: Route[] = [
      {
        path: '',
        component: NotificationsComponent,
        canActivate: [loginRequiredGuard]
      }
    ];
@NgModule({
  declarations: [
    NotificationsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CardModule,
    ProgressSpinnerModule,
    SingleNotificationModule,
    DeferModule,
    DataViewModule

  ]
})
export class NotificationsModule { }
