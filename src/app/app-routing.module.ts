import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditProfileComponent } from './dashboard/edit-profile/edit-profile.component';
import { ActivateAccountComponent } from './mainpage/activate-account/activate-account.component';
import { LoginComponent } from './mainpage/login/login.component';
import { RecoverPasswordComponent } from './mainpage/recover-password/recover-password.component';
import { RegisterComponent } from './mainpage/register/register.component';
import { ResetPasswordComponent } from './mainpage/reset-password/reset-password.component';
import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';
import { PostResolver } from './resolvers/post.resolver';

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
  loadChildren: () => import ('./single-post/single-post.module').then(m => m.SinglePostModule),
},
{
  path: 'blog',
  loadChildren: () => import ('./view-blog/view-blog.module').then(m => m.ViewBlogModule),
},
{
  path: 'editProfile',
  component: EditProfileComponent
},
{
  path: '**',
  component: PagenotfoundComponent
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload', initialNavigation: 'enabledBlocking' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
