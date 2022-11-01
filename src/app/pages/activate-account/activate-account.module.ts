import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivateAccountComponent } from './activate-account.component';
import { ButtonModule } from 'primeng/button';
import { RouterModule, Routes } from '@angular/router';
import { NavigationMenuBasicComponent } from 'src/app/components/navigation-menu-basic/navigation-menu-basic.component';
import { NavigationMenuBasicModule } from 'src/app/components/navigation-menu-basic/navigation-menu-basic.module';




const routes: Routes = [
  {
    path: '',
    component: NavigationMenuBasicComponent,
    children: [
      {
        path: ':email/:activationCode',
        component: ActivateAccountComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
    ActivateAccountComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    NavigationMenuBasicModule,
    RouterModule.forChild(routes)
  ]
})
export class ActivateAccountModule { }
