import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditProfileComponent } from './dashboard/edit-profile/edit-profile.component';

const routes: Routes = [
{
  path: 'register',
  loadChildren: () => import ('./mainpage/register/register.module').then(m => m.RegisterModule)
},
{
  path: 'recoverPassword',
  loadChildren: () => import ('./mainpage/recover-password/recover-password.module').then(m => m.RecoverPasswordModule)
},
{
  path: 'dashboard',
  loadChildren: () => import ('./dashboard/dashboard.module').then(m => m.DashboardModule)
},
{
  path: 'activate',
  loadChildren: () => import ('./mainpage/activate-account/activate-account.module').then(m => m.ActivateAccountModule)


},
{
  path: 'resetPassword',
  loadChildren: () => import ('./mainpage/reset-password/reset-password.module').then(m => m.ResetPasswordModule)
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
  loadChildren: () => import ('./dashboard/edit-profile/edit-profile.module').then(m => m.EditProfileModule)

},
{
  path: '',
  loadChildren: () => import ('./mainpage/login/login.module').then(m => m.LoginModule)
},
{
  path: '**',
  loadChildren: () => import ('./pagenotfound/pagenotfound.module').then(m => m.PagenotfoundModule),
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload', initialNavigation: 'enabledBlocking' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
