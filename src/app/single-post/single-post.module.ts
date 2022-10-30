import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ViewPostComponent } from './view-post/view-post.component';
import { PostResolver } from '../resolvers/post.resolver';
import { SharedWafrnModule } from '../sharedWafrn/shared-wafrn.module';

const routes: Routes = [
  {
    path: ':id',
    resolve: { posts: PostResolver },
    data: { revalidate: 3600 },
    component: ViewPostComponent
  }
];

@NgModule({
  declarations: [
    ViewPostComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    // TODO delete this resource hog
    SharedWafrnModule,
  ]
})
export class SinglePostModule { }
