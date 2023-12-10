import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportPostComponent } from './report-post.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ReportPostComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    ReportPostComponent
  ]
})
export class ReportPostModule { }
