import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SingleNotificationComponent } from './single-notification.component';
import { CardModule } from 'primeng/card';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    SingleNotificationComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    CardModule
  ],
  exports: [
    SingleNotificationComponent
  ]
})
export class SingleNotificationModule { }
