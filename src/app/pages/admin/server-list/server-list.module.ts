import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerListComponent } from './server-list.component';
import { Route, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';

const routes: Route[] = [
  {
    path: '',
    component: ServerListComponent,
  },
];

@NgModule({
  declarations: [ServerListComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,
  ],
})
export class ServerListModule {}
