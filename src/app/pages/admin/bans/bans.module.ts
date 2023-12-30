import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BansComponent } from './bans.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    BansComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{
      path: '',
      component: BansComponent
    }])

  ]
})
export class BansModule { }
