import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { NavigationMenuBasicComponent } from 'src/app/components/navigation-menu-basic/navigation-menu-basic.component';
import { NavigationMenuBasicModule } from 'src/app/components/navigation-menu-basic/navigation-menu-basic.module';


const routes: Routes = [
  {
    path: '',
    component: NavigationMenuBasicComponent,
    children: [
      {
        path: '',
        component: LoginComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressSpinnerModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    NavigationMenuBasicModule,
    RouterModule.forChild(routes)
  ]
})
export class LoginModule { }
