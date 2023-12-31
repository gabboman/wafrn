import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportListComponent } from './report-list.component';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';

@NgModule({
  declarations: [ReportListComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ReportListComponent,
      },
    ]),
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,
  ],
})
export class ReportListModule {}
