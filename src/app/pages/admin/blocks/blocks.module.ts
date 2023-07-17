import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlocksComponent } from './blocks.component';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';



@NgModule({
  declarations: [
    BlocksComponent
  ],
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    RouterModule.forChild([
      {
        path: '',
        component: BlocksComponent
      }
    ])
  ]
})
export class BlocksModule { }
