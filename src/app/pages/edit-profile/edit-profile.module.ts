import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditProfileComponent } from './edit-profile.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { NavigationMenuModule } from 'src/app/components/navigation-menu/navigation-menu.module';
import { NavigationMenuComponent } from 'src/app/components/navigation-menu/navigation-menu.component';



const routes: Routes = [
  {
    path: '',
    component: NavigationMenuComponent,
    children: [
      {
        path: '',
        component: EditProfileComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
    EditProfileComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    ProgressSpinnerModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    NavigationMenuModule
  ]
})
export class EditProfileModule { }
