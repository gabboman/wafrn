import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeletePostComponent } from './delete-post.component';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';



@NgModule({
  declarations: [
    DeletePostComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
  ],
  exports: [
    DeletePostComponent
  ]
})
export class DeletePostModule { }
