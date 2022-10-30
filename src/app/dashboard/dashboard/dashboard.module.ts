import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { RouterModule, Routes } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { SharedWafrnModule } from 'src/app/sharedWafrn/shared-wafrn.module';


const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'explore',
    component: DashboardComponent
  }
];

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ProgressSpinnerModule,
    CardModule,
    SharedWafrnModule

  ]
})
export class DashboardModule { }
