import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DashboardComponent } from './dashboard.component'
import { RouterModule, Routes } from '@angular/router'
import { PostModule } from 'src/app/components/post/post.module'
import { loginRequiredGuard } from 'src/app/guards/login-required.guard'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { MatButtonModule } from '@angular/material/button'
import { LoaderComponent } from 'src/app/components/loader/loader.component'

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [loginRequiredGuard]
  },
  {
    path: 'explore',
    component: DashboardComponent,
    canActivate: [loginRequiredGuard]
  },
  {
    path: 'exploreLocal',
    component: DashboardComponent
  },
  {
    path: 'private',
    component: DashboardComponent,
    canActivate: [loginRequiredGuard]
  }
]

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    PostModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    FontAwesomeModule,
    LoaderComponent
  ]
})
export class DashboardModule {}
