import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivacyComponent } from './privacy.component';
import { CardModule } from 'primeng/card';
import { Route, RouterModule } from '@angular/router';
import { NavigationMenuModule } from 'src/app/components/navigation-menu/navigation-menu.module';
import { NavigationMenuComponent } from 'src/app/components/navigation-menu/navigation-menu.component';


const routes: Route[] = [
{

  path: '',
  component: NavigationMenuComponent,
  children: [
    {
      path: '',
      component: PrivacyComponent
    }
  ]
}

];

@NgModule({
  declarations: [
    PrivacyComponent
  ],
  imports: [
    CommonModule,
    CardModule,
    NavigationMenuModule,
    RouterModule.forChild(routes)

  ]
})
export class PrivacyModule { }
