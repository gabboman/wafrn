import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportListComponent } from './report-list.component';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';



@NgModule({
  declarations: [
    ReportListComponent,

  ],
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    ButtonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ReportListComponent
      }
    ])
  ]
})
export class ReportListModule { }
