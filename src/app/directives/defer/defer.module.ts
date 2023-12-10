import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeferredLoader } from './defer';



@NgModule({
  declarations: [
    DeferredLoader
  ],
  imports: [
    CommonModule
  ],
  exports: [
    DeferredLoader
  ]
})
export class DeferModule { }
