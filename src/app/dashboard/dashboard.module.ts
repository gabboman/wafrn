import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import {EditorModule} from 'primeng/editor';
import {DeferModule} from 'primeng/defer';
import { SharedWafrnModule } from '../sharedWafrn/shared-wafrn.module';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CreatorComponent } from './creator/creator.component';
import {MenubarModule} from 'primeng/menubar';

const routes: Routes = [{
  path: '',
  component: DashboardComponent
}
];

@NgModule({
  declarations: [
    DashboardComponent,
    CreatorComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    EditorModule,
    DeferModule,
    SharedWafrnModule,
    ProgressSpinnerModule,
    MenubarModule,
  ]
})
export class DashboardModule { }
