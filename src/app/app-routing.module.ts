import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivateAccountComponent } from './mainpage/activate-account/activate-account.component';
import { LoginComponent } from './mainpage/login/login.component';
import { RecoverPasswordComponent } from './mainpage/recover-password/recover-password.component';
import { RegisterComponent } from './mainpage/register/register.component';
import { ResetPasswordComponent } from './mainpage/reset-password/reset-password.component';
import { ViewBlogComponent } from './mainpage/view-blog/view-blog.component';
import { ViewPostComponent } from './mainpage/view-post/view-post.component';

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
  path: 'post/:id',
  component: ViewPostComponent
},
{
  path: 'blog/:url',
  component: ViewBlogComponent,
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
