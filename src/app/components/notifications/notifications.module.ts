import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from './notifications.component';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { BadgeModule } from 'primeng/badge';



@NgModule({
  declarations: [
    NotificationsComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    RouterModule,
    DataViewModule,
    DialogModule,
    BadgeModule
  ],
  exports: [
    NotificationsComponent,
  ]
})
export class NotificationsModule { }
