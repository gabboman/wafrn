import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WafrnMediaComponent } from './wafrn-media.component';
import { CardModule } from 'primeng/card';



@NgModule({
  declarations: [
    WafrnMediaComponent
  ],
  imports: [
    CommonModule,
    CardModule
  ],
  exports: [
    WafrnMediaComponent
  ]
})
export class WafrnMediaModule { }
