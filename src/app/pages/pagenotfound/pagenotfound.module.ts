import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagenotfoundComponent } from './pagenotfound.component';
import { CardModule } from 'primeng/card';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: PagenotfoundComponent
  }
];

@NgModule({
  declarations: [
    PagenotfoundComponent
  ],
  imports: [
    CommonModule,
    CardModule,
    RouterModule.forChild(routes)
  ]
})
export class PagenotfoundModule { }
