import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollComponent } from './poll.component';



@NgModule({
  declarations: [
    PollComponent
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    PollComponent
  ]
})
export class PollModule { }
