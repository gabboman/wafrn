import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagenotfoundComponent } from './pagenotfound.component';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

const routes: Routes = [
  {
    path: '',
    component: PagenotfoundComponent,
  },
];

@NgModule({
  declarations: [PagenotfoundComponent],
  imports: [CommonModule, RouterModule.forChild(routes), MatCardModule],
  exports: [PagenotfoundComponent],
})
export class PagenotfoundModule {}
