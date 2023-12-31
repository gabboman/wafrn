import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, RouterModule } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';

const routes: Route[] = [
  {
    path: 'server-list',
    loadChildren: () =>
      import('./server-list/server-list.module').then(
        (m) => m.ServerListModule
      ),
  },
  {
    path: 'user-blocks',
    loadChildren: () =>
      import('./blocks/blocks.module').then((m) => m.BlocksModule),
  },
  {
    path: 'user-reports',
    loadChildren: () =>
      import('./report-list/report-list.module').then(
        (m) => m.ReportListModule
      ),
  },
  {
    path: 'bans',
    loadChildren: () => import('./bans/bans.module').then((m) => m.BansModule),
  },
];
@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class AdminModule {}
