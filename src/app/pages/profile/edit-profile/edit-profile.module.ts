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
import { InputTextareaModule } from 'primeng/inputtextarea';
import { loginRequiredGuard } from 'src/app/guards/login-required.guard';
import { QuillModule } from 'ngx-quill';

const routes: Routes = [
      {
        path: '',
        component: EditProfileComponent,
        canActivate: [loginRequiredGuard]
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
    QuillModule
  ]
})
export class EditProfileModule { }
