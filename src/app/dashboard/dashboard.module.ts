import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import {EditorModule} from 'primeng/editor';
import {DeferModule} from 'primeng/defer';
import { SharedWafrnModule } from '../sharedWafrn/shared-wafrn.module';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CreatorComponent } from './creator/creator.component';
import {SpeedDialModule} from 'primeng/speeddial';
import {DialogModule} from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { CaptchaModule } from 'primeng/captcha';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import {CheckboxModule} from 'primeng/checkbox';
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
    SpeedDialModule,
    DialogModule,
    FormsModule,
    CaptchaModule,
    OverlayPanelModule,
    CheckboxModule
  ]
})
export class DashboardModule { }
