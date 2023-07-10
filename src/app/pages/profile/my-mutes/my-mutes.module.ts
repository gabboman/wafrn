import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TableModule } from 'primeng/table';
import { MyMutesComponent } from './my-mutes.component';



@NgModule({
  declarations: [
    MyMutesComponent
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
        component: MyMutesComponent
      }
    ])
  ]
})
export class MyMutesModule { }
