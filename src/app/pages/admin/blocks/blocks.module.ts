import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlocksComponent } from './blocks.component';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';

@NgModule({
  declarations: [BlocksComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: BlocksComponent,
      },
    ]),
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,
  ],
})
export class BlocksModule {}
