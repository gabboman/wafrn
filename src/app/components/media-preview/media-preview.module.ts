import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaPreviewComponent } from './media-preview.component';



@NgModule({
  declarations: [
    MediaPreviewComponent
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    MediaPreviewComponent
  ]
})
export class MediaPreviewModule { }
