import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollComponent } from './poll.component';
import {MatProgressBarModule} from '@angular/material/progress-bar';


@NgModule({
  declarations: [
    PollComponent
  ],
  imports: [
    CommonModule,
    MatProgressBarModule
  ],
  exports: [
    PollComponent
  ]
})
export class PollModule { }
