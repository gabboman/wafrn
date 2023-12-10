import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SingleNotificationComponent } from './single-notification.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    SingleNotificationComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: [
    SingleNotificationComponent
  ]
})
export class SingleNotificationModule { }
