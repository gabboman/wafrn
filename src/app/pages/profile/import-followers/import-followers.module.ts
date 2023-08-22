import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportFollowersComponent } from './import-followers.component';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FileUploadModule } from 'primeng/fileupload';
import { MessagesModule } from 'primeng/messages';

@NgModule({
  declarations: [
    ImportFollowersComponent
  ],
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    FileUploadModule,
    ProgressSpinnerModule,
    MessagesModule,
    RouterModule.forChild([
      {
        path: '',
        component: ImportFollowersComponent
      }
    ])
  ]
})
export class ImportFollowersModule { }
