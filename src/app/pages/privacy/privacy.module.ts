import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivacyComponent } from './privacy.component';
import { Route, RouterModule } from '@angular/router';



const routes: Route[] = [
    {
      path: '',
      component: PrivacyComponent
    }
  ];

@NgModule({
  declarations: [
    PrivacyComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)

  ]
})
export class PrivacyModule { }
