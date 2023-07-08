import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerListComponent } from './server-list.component';
import { Route, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';

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
    CardModule,
    ProgressSpinnerModule,
    TableModule,
    InputSwitchModule,
    ButtonModule,
    InputTextareaModule,
    RouterModule.forChild(routes)
  ]
})
export class ServerListModule { }
