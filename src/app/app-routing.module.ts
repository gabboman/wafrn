import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
{
  path: 'register',
  loadChildren: () => import ('./pages/register/register.module').then(m => m.RegisterModule)
},
{
  path: 'recoverPassword',
  loadChildren: () => import ('./pages/recover-password/recover-password.module').then(m => m.RecoverPasswordModule)
},
{
  path: 'dashboard/search',
  loadChildren: () => import ('./pages/search/search.module').then(m => m.SearchModule)
},
{
  path: 'dashboard',
  loadChildren: () => import ('./pages/dashboard/dashboard.module').then(m => m.DashboardModule)
},
{
  path: 'activate',
  loadChildren: () => import ('./pages/activate-account/activate-account.module').then(m => m.ActivateAccountModule)


},
{
  path: 'resetPassword',
  loadChildren: () => import ('./pages/reset-password/reset-password.module').then(m => m.ResetPasswordModule)
},
{
  path: 'post',
  loadChildren: () => import ('./pages/single-post/single-post.module').then(m => m.SinglePostModule),
},
{
  path: 'blog',
  loadChildren: () => import ('./pages/view-blog/view-blog.module').then(m => m.ViewBlogModule),
},
{
  path: 'editProfile',
  loadChildren: () => import ('./pages/edit-profile/edit-profile.module').then(m => m.EditProfileModule)

},
{
  path: '',
  loadChildren: () => import ('./pages/login/login.module').then(m => m.LoginModule)
},
{
  path: '**',
  loadChildren: () => import ('./pages/pagenotfound/pagenotfound.module').then(m => m.PagenotfoundModule),
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload', initialNavigation: 'enabledBlocking' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
