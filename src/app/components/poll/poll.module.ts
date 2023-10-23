import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollComponent } from './poll.component';
import { ProgressBarModule } from 'primeng/progressbar';



@NgModule({
  declarations: [
    PollComponent
  ],
  imports: [
    CommonModule,
    ProgressBarModule
  ],
  exports: [
    PollComponent
  ]
})
export class PollModule { }
