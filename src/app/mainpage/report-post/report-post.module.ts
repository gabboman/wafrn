import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportPostComponent } from './report-post.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import {ListboxModule} from 'primeng/listbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';


@NgModule({
  declarations: [
    ReportPostComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CheckboxModule,
    ListboxModule,
    DialogModule,
    InputTextModule,
    ButtonModule
  ],
  exports: [
    ReportPostComponent
  ]
})
export class ReportPostModule { }
