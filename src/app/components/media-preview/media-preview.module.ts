import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaPreviewComponent } from './media-preview.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';



@NgModule({
  declarations: [
    MediaPreviewComponent
  ],
  imports: [
    CommonModule,
    ProgressSpinnerModule
  ],
  exports: [
    MediaPreviewComponent
  ]
})
export class MediaPreviewModule { }
