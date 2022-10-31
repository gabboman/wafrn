import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [

  {
    path: 'search',
    loadChildren: () => import ('./search/search.module').then(m => m.SearchModule)

  },
  {
    path: '',
    loadChildren: () => import ('./dashboard/dashboard.module').then(m => m.DashboardModule)

  },
];

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ]
})
export class DashboardModule { }
