import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerListComponent } from './server-list.component';
import { Route } from '@angular/router';


const routes: Route[] = [
  {
    path: 'servers',
    component: ServerListComponent
  }
]

@NgModule({
  declarations: [
    ServerListComponent
  ],
  imports: [
    CommonModule
  ]
})
export class ServerListModule { }
