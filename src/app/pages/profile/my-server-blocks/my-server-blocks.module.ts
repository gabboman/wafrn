import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyServerBlocksComponent } from './my-server-blocks.component';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';



@NgModule({
  declarations: [
    MyServerBlocksComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    RouterModule.forChild([{
      path: '',
      component: MyServerBlocksComponent
    }])
  ]
})
export class MyServerBlocksModule { }
