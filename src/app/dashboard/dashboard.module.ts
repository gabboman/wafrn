import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EditorModule } from 'primeng/editor';
import { DeferModule } from 'primeng/defer';
import { SharedWafrnModule } from '../sharedWafrn/shared-wafrn.module';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CreatorComponent } from './creator/creator.component';
import { SpeedDialModule } from 'primeng/speeddial';
import { DialogModule } from 'primeng/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CaptchaModule } from 'primeng/captcha';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { SearchComponent } from './search/search.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import {ChipsModule} from 'primeng/chips';
import { InputTextModule } from 'primeng/inputtext';
import {CarouselModule} from 'primeng/carousel';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'search',
    component: SearchComponent
  }
];

@NgModule({
  declarations: [
    DashboardComponent,
    CreatorComponent,
    SearchComponent,
    SearchResultsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    EditorModule,
    DeferModule,
    SharedWafrnModule,
    ProgressSpinnerModule,
    SpeedDialModule,
    DialogModule,
    FormsModule,
    ReactiveFormsModule,
    CaptchaModule,
    OverlayPanelModule,
    CheckboxModule,
    CardModule,
    ChipsModule,
    InputTextModule,
    CarouselModule
  ]
})
export class DashboardModule { }
