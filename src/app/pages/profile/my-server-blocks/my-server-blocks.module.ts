import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyServerBlocksComponent } from './my-server-blocks.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';

@NgModule({
  declarations: [MyServerBlocksComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: MyServerBlocksComponent,
      },
    ]),
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,
  ],
})
export class MyServerBlocksModule {}
