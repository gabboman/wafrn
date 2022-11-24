import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivacyComponent } from './privacy.component';
import { CardModule } from 'primeng/card';
import { Route, RouterModule } from '@angular/router';
import { NavigationMenuBasicComponent } from 'src/app/components/navigation-menu-basic/navigation-menu-basic.component';
import { NavigationMenuBasicModule } from 'src/app/components/navigation-menu-basic/navigation-menu-basic.module';


const routes: Route[] = [
{

  path: '',
  component: NavigationMenuBasicComponent,
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
    NavigationMenuBasicModule,
    RouterModule.forChild(routes)

  ]
})
export class PrivacyModule { }
