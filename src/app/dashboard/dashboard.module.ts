import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import {EditorModule} from 'primeng/editor';

const routes: Routes = [{
  path: '',
  component: DashboardComponent
}
];

@NgModule({
  declarations: [
    DashboardComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    EditorModule

  ]
})
export class DashboardModule { }
