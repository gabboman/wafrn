import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CssEditorComponent } from './css-editor.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';



@NgModule({
  declarations: [
    CssEditorComponent
  ],
  imports: [
    CommonModule,
    CardModule,
    ProgressSpinnerModule,
    FormsModule,
    ButtonModule,
    InputTextareaModule,
    RouterModule.forChild([{
      path: '',
      component: CssEditorComponent
    }])
  ]
})
export class CssEditorModule { }
