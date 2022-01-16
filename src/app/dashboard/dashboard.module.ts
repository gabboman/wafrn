import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DeferModule } from 'primeng/defer';
import { SharedWafrnModule } from '../sharedWafrn/shared-wafrn.module';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CreatorComponent } from './creator/creator.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CaptchaModule } from 'primeng/captcha';
import { CardModule } from 'primeng/card';
import { SearchComponent } from './search/search.component';
import { InputTextModule } from 'primeng/inputtext';
import {CarouselModule} from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'search',
    component: SearchComponent
  },
  {
    path: 'explore',
    component: DashboardComponent
  },
  {
    path: 'search/:term',
    component: SearchComponent
  }
];

@NgModule({
  declarations: [
    DashboardComponent,
    CreatorComponent,
    SearchComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DeferModule,
    SharedWafrnModule,
    ProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    CaptchaModule,
    CardModule,
    InputTextModule,
    CarouselModule,
    ButtonModule
  ]
})
export class DashboardModule { }
