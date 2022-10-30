import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from './search.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CarouselModule } from 'primeng/carousel';
import { SharedWafrnModule } from 'src/app/sharedWafrn/shared-wafrn.module';
import { DeferModule } from 'primeng/defer';
import { InputTextModule } from 'primeng/inputtext';


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
    // TODO remove the shared module, its a resource hog!
    SharedWafrnModule

  ]
})
export class SearchModule { }
