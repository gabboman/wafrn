import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BansComponent } from './bans.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';



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
    }]),
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,

  ]
})
export class BansModule { }
