import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagenotfoundComponent } from './pagenotfound.component';
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
    RouterModule.forChild(routes)
  ],
  exports: [
    PagenotfoundComponent
  ]
})
export class PagenotfoundModule { }
