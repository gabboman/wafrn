import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Route, RouterModule } from '@angular/router'

const routes: Route[] = [
  {
    path: 'server-list',
    loadChildren: () => import('./server-list/server-list.module').then((m) => m.ServerListModule)
  },
  {
    path: 'user-blocks',
    loadChildren: () => import('./blocks/blocks.module').then((m) => m.BlocksModule)
  },
  {
    path: 'user-reports',
    loadChildren: () => import('./report-list/report-list.module').then((m) => m.ReportListModule)
  },
  {
    path: 'bans',
    loadChildren: () => import('./bans/bans.module').then((m) => m.BansModule)
  },
  {
    path: 'activate-users',
    // new lazyloading method
    loadComponent: () => import('./pending-users/pending-users.component').then((m) => m.PendingUsersComponent)
  },
  {
    path: 'stats',
    // new lazyloading method
    loadComponent: () => import('./stats/stats.component').then((m) => m.StatsComponent)
  },
  {
    path: 'emojis',
    // new lazyloading method
    loadComponent: () => import('./emoji-uploader/emoji-uploader.component').then((m) => m.EmojiUploaderComponent)
  }
]
@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class AdminModule {}
