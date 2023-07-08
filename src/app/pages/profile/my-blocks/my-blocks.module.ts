import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MyBlocksComponent } from './my-blocks.component';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';


@NgModule({
  declarations: [
    MyBlocksComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    InputSwitchModule,
    ButtonModule,
    RouterModule.forChild([
      {
        path: '',
        component: MyBlocksComponent
      }
    ])
  ]
})
export class MyBlocksModule { }
