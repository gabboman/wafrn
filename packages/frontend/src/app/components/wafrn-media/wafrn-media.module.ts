import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WafrnMediaComponent } from './wafrn-media.component';
import { MatCardModule } from '@angular/material/card';



@NgModule({
  declarations: [
    WafrnMediaComponent
  ],
  imports: [
    CommonModule,
    MatCardModule
  ],
  exports: [
    WafrnMediaComponent
  ]
})
export class WafrnMediaModule { }
