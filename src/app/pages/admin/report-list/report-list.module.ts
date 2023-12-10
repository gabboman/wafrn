import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportListComponent } from './report-list.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    ReportListComponent,

  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ReportListComponent
      }
    ])
  ]
})
export class ReportListModule { }
