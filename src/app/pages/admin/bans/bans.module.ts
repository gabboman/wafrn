import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BansComponent } from './bans.component';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    BansComponent
  ],
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    ButtonModule,
    FormsModule,
    RouterModule.forChild([{
      path: '',
      component: BansComponent
    }])

  ]
})
export class BansModule { }
