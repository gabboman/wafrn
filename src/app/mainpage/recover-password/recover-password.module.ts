import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecoverPasswordComponent } from './recover-password.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { RouterModule, Routes } from '@angular/router';
import { ButtonModule } from 'primeng/button';

const routes: Routes = [
  {
    path: '',
    component: RecoverPasswordComponent
  }
];


@NgModule({
  declarations: [
    RecoverPasswordComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    RouterModule.forChild(routes)
  ],
  exports: [
  ]
})
export class RecoverPasswordModule { }
