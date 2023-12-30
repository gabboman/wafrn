import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MyMutesComponent } from './my-mutes.component';



@NgModule({
  declarations: [
    MyMutesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: MyMutesComponent
      }
    ])
  ]
})
export class MyMutesModule { }
