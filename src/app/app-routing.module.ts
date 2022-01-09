import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivateAccountComponent } from './mainpage/activate-account/activate-account.component';
import { LoginComponent } from './mainpage/login/login.component';
import { RecoverPasswordComponent } from './mainpage/recover-password/recover-password.component';
import { RegisterComponent } from './mainpage/register/register.component';
import { ResetPasswordComponent } from './mainpage/reset-password/reset-password.component';
import { PostComponent } from './sharedWafrn/post/post.component';

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
},
{
  path: 'dashboard',
  loadChildren: () => import ('./dashboard/dashboard.module').then(m => m.DashboardModule)
},
{
  path: 'activate/:email/:activationCode',
  component: ActivateAccountComponent

},
{
  path: 'resetPassword/:email/:resetCode',
  component: ResetPasswordComponent
},
{
  path: 'post',
  component: PostComponent
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
