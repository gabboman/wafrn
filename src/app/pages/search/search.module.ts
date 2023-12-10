import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from './search.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DeferModule } from 'src/app/directives/defer/defer.module';
import { PostModule } from 'src/app/components/post/post.module';

const routes: Routes = [
      {
        path: '',
        component: SearchComponent
      },
      {
        path: ':term',
        component: SearchComponent
      }
    ];

@NgModule({
  declarations: [
    SearchComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    DeferModule,
    PostModule,
  ]
})
export class SearchModule { }
