import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PostResolver } from '../resolvers/post.resolver';
import { SharedWafrnModule } from '../sharedWafrn/shared-wafrn.module';
import { SinglePostComponent } from './single-post.component';

const routes: Routes = [
  {
    path: ':id',
    resolve: { posts: PostResolver },
    data: { revalidate: 3600 },
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
    // TODO delete this resource hog
    SharedWafrnModule,
  ]
})
export class SinglePostModule { }
