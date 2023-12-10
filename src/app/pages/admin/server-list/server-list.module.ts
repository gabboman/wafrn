import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerListComponent } from './server-list.component';
import { Route, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';


const routes: Route[] = [
  {
    path: '',
    component: ServerListComponent
  }
]

@NgModule({
  declarations: [
    ServerListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class ServerListModule { }
