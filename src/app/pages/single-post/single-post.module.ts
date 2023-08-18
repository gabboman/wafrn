import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PostResolver } from '../../resolvers/post.resolver';
import { SinglePostComponent } from './single-post.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PostModule } from '../../components/post/post.module';
import { PagenotfoundModule } from '../pagenotfound/pagenotfound.module';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

const routes: Routes = [
      {
        path: ':id',
        resolve: { posts: PostResolver },
        component: SinglePostComponent
      }
    ];

@NgModule({
  declarations: [
    SinglePostComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ProgressSpinnerModule,
    PostModule,
    PagenotfoundModule,
    CardModule,
    TableModule
  ]
})
export class SinglePostModule { }
