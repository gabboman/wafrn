import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CssEditorComponent } from './css-editor.component';
import { QuillModule } from 'ngx-quill';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    CssEditorComponent
  ],
  imports: [
    CommonModule,
    QuillModule,
    FormsModule,
    RouterModule.forChild([{
      path: '',
      component: CssEditorComponent
    }])
  ]
})
export class CssEditorModule { }
