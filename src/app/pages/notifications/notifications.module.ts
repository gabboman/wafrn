import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from './notifications.component';
import { Route, RouterModule } from '@angular/router';
import { DeferModule } from 'src/app/directives/defer/defer.module';
import { loginRequiredGuard } from 'src/app/guards/login-required.guard';
import { SingleNotificationComponent } from 'src/app/components/single-notification/single-notification.component';

const routes: Route[] = [
  {
    path: '',
    component: NotificationsComponent,
    canActivate: [loginRequiredGuard],
  },
];
@NgModule({
  declarations: [NotificationsComponent],
  imports: [
    CommonModule,
    SingleNotificationComponent,
    RouterModule.forChild(routes),
    DeferModule,
  ],
})
export class NotificationsModule {}
