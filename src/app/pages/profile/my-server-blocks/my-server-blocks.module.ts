import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyServerBlocksComponent } from './my-server-blocks.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    MyServerBlocksComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{
      path: '',
      component: MyServerBlocksComponent
    }])
  ]
})
export class MyServerBlocksModule { }
