import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from './search.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CarouselModule } from 'primeng/carousel';
import { DeferModule } from 'primeng/defer';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PostModule } from 'src/app/post/post.module';


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
    CardModule,
    ProgressSpinnerModule,
    CarouselModule,
    RouterModule.forChild(routes),
    DeferModule,
    InputTextModule,
    ButtonModule,
    DeferModule,
    PostModule

  ]
})
export class SearchModule { }
