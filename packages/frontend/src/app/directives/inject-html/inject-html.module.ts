import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InjectHTMLDirective } from './inject-html.directive';



@NgModule({
  declarations: [
    InjectHTMLDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    InjectHTMLDirective
  ]
})
export class InjectHtmlModule { }