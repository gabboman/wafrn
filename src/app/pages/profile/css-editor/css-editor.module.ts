import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CssEditorComponent } from './css-editor.component';
import { QuillModule } from 'ngx-quill';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [CssEditorComponent],
  imports: [
    CommonModule,
    QuillModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: CssEditorComponent,
      },
    ]),
    MatCardModule,
  ],
})
export class CssEditorModule {}
