import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SinglePostComponent } from './single-post.component';
import { PostModule } from '../../components/post/post.module';
import { PagenotfoundModule } from '../pagenotfound/pagenotfound.module';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

const routes: Routes = [
  {
    path: ':id',
    component: SinglePostComponent,
  },
];

@NgModule({
  declarations: [SinglePostComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    PostModule,
    PagenotfoundModule,
    MatTableModule,
    MatPaginatorModule,
  ],
})
export class SinglePostModule {}
