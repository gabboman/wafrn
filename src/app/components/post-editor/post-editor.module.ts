import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostEditorComponent } from './post-editor.component';
import { ButtonModule } from 'primeng/button';
import { ChipsModule } from 'primeng/chips';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { FileUploadModule } from 'primeng/fileupload';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { MediaPreviewModule } from '../media-preview/media-preview.module';
import { NgxEditorModule } from 'ngx-editor';

@NgModule({
  declarations: [
    PostEditorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    ChipsModule,
    OverlayPanelModule,
    FileUploadModule,
    CheckboxModule,
    DialogModule,
    TooltipModule,
    TagModule,
    DropdownModule,
    MediaPreviewModule,
    NgxEditorModule
  ],
  exports: [
    PostEditorComponent
  ]
})
export class PostEditorModule { }
