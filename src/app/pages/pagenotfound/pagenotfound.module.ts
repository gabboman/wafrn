import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagenotfoundComponent } from './pagenotfound.component';
import { CardModule } from 'primeng/card';
import { RouterModule, Routes } from '@angular/router';
import { NavigationMenuComponent } from 'src/app/components/navigation-menu/navigation-menu.component';
import { NavigationMenuModule } from 'src/app/components/navigation-menu/navigation-menu.module';

const routes: Routes = [

  {
    path: '',
    component: NavigationMenuComponent,
    children: [
      {
        path: '',
        component: PagenotfoundComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
    PagenotfoundComponent
  ],
  imports: [
    CommonModule,
    CardModule,
    NavigationMenuModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    PagenotfoundComponent
  ]
})
export class PagenotfoundModule { }
