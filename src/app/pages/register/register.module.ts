import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterComponent } from './register.component';
import { RouterModule, Routes } from '@angular/router';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { KeyFilterModule } from 'primeng/keyfilter';
import { TooltipModule } from 'primeng/tooltip';
import { userLoggedGuard } from 'src/app/guards/user-logged.guard';

const routes: Routes = [
      {
        path: '',
        component: RegisterComponent,
        canActivate: [userLoggedGuard]
      }
    ];

@NgModule({
  declarations: [
    RegisterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CalendarModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    KeyFilterModule,
    TooltipModule,
    RouterModule.forChild(routes)
  ]
})
export class RegisterModule { }
