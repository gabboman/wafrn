import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MyBlocksComponent } from './my-blocks.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    MyBlocksComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: MyBlocksComponent
      }
    ])
  ]
})
export class MyBlocksModule { }
