import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlocksComponent } from './blocks.component';
import { RouterModule } from '@angular/router';




@NgModule({
  declarations: [
    BlocksComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: BlocksComponent
      }
    ])
  ]
})
export class BlocksModule { }
