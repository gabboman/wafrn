import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivateAccountComponent } from './activate-account.component';
import { ButtonModule } from 'primeng/button';
import { RouterModule, Routes } from '@angular/router';




const routes: Routes = [
  {
    path: ':email/:activationCode',
    component: ActivateAccountComponent
  }
];

@NgModule({
  declarations: [
    ActivateAccountComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    RouterModule.forChild(routes)
  ]
})
export class ActivateAccountModule { }
