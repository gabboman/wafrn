import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CssEditorComponent } from './css-editor.component';



@NgModule({
  declarations: [
    CssEditorComponent
  ],
  imports: [
    CommonModule,
    CardModule,
    ProgressSpinnerModule
  ]
})
export class CssEditorModule { }
