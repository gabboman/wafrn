import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivacyComponent } from './privacy.component';
import { Route, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

const routes: Route[] = [
  {
    path: '',
    component: PrivacyComponent,
  },
];

@NgModule({
  declarations: [PrivacyComponent],
  imports: [CommonModule, RouterModule.forChild(routes), MatCardModule],
})
export class PrivacyModule {}
