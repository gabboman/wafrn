import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './mainpage/login/login.component';
import { RecoverPasswordComponent } from './mainpage/recover-password/recover-password.component';
import { RegisterComponent } from './mainpage/register/register.component';

const routes: Routes = [{
  path: '',
  component: LoginComponent
},{
  path: 'register',
  component: RegisterComponent
},
{
  path: 'recoverPassword',
  component: RecoverPasswordComponent
},{
  path: 'dashboard',
  loadChildren: () => import ('./dashboard/dashboard.module').then(m => m.DashboardModule)
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
