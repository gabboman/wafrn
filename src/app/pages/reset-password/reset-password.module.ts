import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResetPasswordComponent } from './reset-password.component';
import { RouterModule, Routes } from '@angular/router';
import { CardModule } from 'primeng/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { NavigationMenuBasicComponent } from 'src/app/components/navigation-menu-basic/navigation-menu-basic.component';
import { NavigationMenuBasicModule } from 'src/app/components/navigation-menu-basic/navigation-menu-basic.module';



const routes: Routes = [
  {
    path: '',
    component: NavigationMenuBasicComponent,
    children: [
      {
        path: ':email/:resetCode',
        component: ResetPasswordComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
    ResetPasswordComponent
  ],
  imports: [
    CommonModule,
    CardModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    NavigationMenuBasicModule,
    RouterModule.forChild(routes)
  ]
})
export class ResetPasswordModule { }
