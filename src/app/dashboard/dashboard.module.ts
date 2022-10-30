import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DeferModule } from 'primeng/defer';
import { SharedWafrnModule } from '../sharedWafrn/shared-wafrn.module';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SearchComponent } from './search/search.component';
import { InputTextModule } from 'primeng/inputtext';
import {CarouselModule} from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';

const routes: Routes = [

  {
    path: 'search',
    loadChildren: () => import ('./search/search.module').then(m => m.SearchModule)

  },
  {
    path: 'profile',
    loadChildren: () => import ('./edit-profile/edit-profile.module').then(m => m.EditProfileModule)
  },
  {
    path: '',
    loadChildren: () => import ('./dashboard/dashboard.module').then(m => m.DashboardModule)

  },
];

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ]
})
export class DashboardModule { }
