import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecoverPasswordComponent } from './recover-password.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { RouterModule, Routes } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { KeyFilterModule } from 'primeng/keyfilter';
import { InputTextModule } from 'primeng/inputtext';
import { NavigationMenuBasicComponent } from 'src/app/components/navigation-menu-basic/navigation-menu-basic.component';
import { NavigationMenuBasicModule } from 'src/app/components/navigation-menu-basic/navigation-menu-basic.module';

const routes: Routes = [
  {
    path: '',
    component: NavigationMenuBasicComponent,
    children: [
      {
        path: '',
        component: RecoverPasswordComponent
      }
    ]
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
    KeyFilterModule,
    InputTextModule,
    NavigationMenuBasicModule,
    RouterModule.forChild(routes)
  ],
  exports: [
  ]
})
export class RecoverPasswordModule { }
