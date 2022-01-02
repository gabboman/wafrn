import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import {EditorModule} from 'primeng/editor';
import {DeferModule} from 'primeng/defer';
import { SharedWafrnModule } from '../sharedWafrn/shared-wafrn.module';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

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
    EditorModule,
    DeferModule,
    SharedWafrnModule,
    ProgressSpinnerModule

  ]
})
export class DashboardModule { }
