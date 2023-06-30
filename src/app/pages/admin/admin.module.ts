import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, RouterModule } from '@angular/router';



const routes: Route[] = [
  {
    path: 'server-list',
    loadChildren: () => import('./server-list/server-list.module').then(m => m.ServerListModule)
  }
]
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminModule { }
