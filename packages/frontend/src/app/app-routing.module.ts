import { NgModule } from '@angular/core'
import { PreloadAllModules, RouteReuseStrategy, RouterModule, Routes } from '@angular/router'
import { NavigationMenuComponent } from './components/navigation-menu/navigation-menu.component'
import { NavigationMenuModule } from './components/navigation-menu/navigation-menu.module'
import { isAdminGuard } from './guards/is-admin.guard'
import { loginRequiredGuard } from './guards/login-required.guard'
import { CustomReuseStrategy } from './services/routing.service'
import { userLoggedGuard } from './guards/user-logged.guard'

const routes: Routes = [
  {
    path: '',
    component: NavigationMenuComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [userLoggedGuard],
        loadComponent: () =>
          import('./components/home-redirector/home-redirector.component').then((m) => m.HomeRedirectorComponent)
        //loadChildren: () =>
      },

      {
        path: 'register',
        canActivate: [userLoggedGuard],
        loadChildren: () => import('./pages/register/register.module').then((m) => m.RegisterModule)
      },
      {
        path: 'about',
        loadChildren: () => import('./pages/privacy/privacy.module').then((m) => m.PrivacyModule)
      },
      // TODO delete this route in the future I guess
      {
        path: 'privacy',
        loadChildren: () => import('./pages/privacy/privacy.module').then((m) => m.PrivacyModule)
      },
      {
        path: 'recoverPassword',
        loadChildren: () =>
          import('./pages/recover-password/recover-password.module').then((m) => m.RecoverPasswordModule)
      },
      {
        path: 'mfaSetup',
        loadChildren: () => import('./pages/mfa-setup/mfa-setup.module').then((m) => m.MfaSetupModule)
      },
      {
        path: 'dashboard/search',
        loadChildren: () => import('./pages/search/search.module').then((m) => m.SearchModule)
      },
      {
        path: 'dashboard/notifications',
        loadChildren: () => import('./pages/notifications/notifications.module').then((m) => m.NotificationsModule)
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
        data: { reuseRoute: false } // We reuse the children, but not this route specifically.
      },
      {
        path: 'activate',
        loadChildren: () =>
          import('./pages/activate-account/activate-account.module').then((m) => m.ActivateAccountModule)
      },
      {
        path: 'resetPassword',
        loadChildren: () => import('./pages/reset-password/reset-password.module').then((m) => m.ResetPasswordModule)
      },
      {
        path: 'post/:id',
        redirectTo: '/fediverse/post/:id'
      },
      {
        path: 'fediverse/post',
        loadChildren: () => import('./pages/single-post/single-post.module').then((m) => m.SinglePostModule)
      },
      {
        path: 'article',
        loadChildren: () => import('./pages/single-post/single-post.module').then((m) => m.SinglePostModule)
      },
      {
        path: 'blog',
        loadChildren: () => import('./pages/view-blog/view-blog.module').then((m) => m.ViewBlogModule),
        data: { reuseRoute: false } // BUG ON THIS ONE. THIS ONE GOES INTO A LOOP
      },
      {
        path: 'profile',
        loadChildren: () => import('./pages/profile/profile.module').then((m) => m.ProfileModule),
        canActivate: [loginRequiredGuard]
      },
      {
        path: 'login',
        loadChildren: () => import('./pages/login/login.module').then((m) => m.LoginModule)
      },
      {
        path: 'login/mfa',
        loadChildren: () => import('./pages/login-mfa/login-mfa.module').then((m) => m.LoginMfaModule)
      },
      {
        path: 'admin',
        loadChildren: () => import('./pages/admin/admin.module').then((m) => m.AdminModule),
        canActivate: [isAdminGuard]
      },
      {
        path: 'doom',
        loadChildren: () => import('./pages/doom/doom.module').then((m) => m.DoomModule)
      },
      {
        path: 'editor',
        canActivate: [loginRequiredGuard],
        loadComponent: () => import('./components/new-editor/new-editor.component').then((m) => m.NewEditorComponent)
      },
      {
        path: 'aac4alex',
        loadComponent: () => import('./pages/aac-for-alex/aac-for-alex.component').then((m) => m.AacForAlexComponent)
      },
      {
        path: '**',
        loadChildren: () => import('./pages/pagenotfound/pagenotfound.module').then((m) => m.PagenotfoundModule)
      }
    ]
  }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled'
    }),
    NavigationMenuModule
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: CustomReuseStrategy }],
  exports: [RouterModule]
})
export class AppRoutingModule {}
