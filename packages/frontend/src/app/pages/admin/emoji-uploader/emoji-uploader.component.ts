import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { EmojiCollectionsComponent } from 'src/app/components/emoji-collections/emoji-collections.component';
import { FileUploadComponent } from 'src/app/components/file-upload/file-upload.component';
import { LoaderComponent } from 'src/app/components/loader/loader.component';

@Component({
  selector: 'app-emoji-uploader',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    LoaderComponent,
    FileUploadComponent,
    EmojiCollectionsComponent
  ],
  templateUrl: './emoji-uploader.component.html',
  styleUrl: './emoji-uploader.component.scss'
})
export class EmojiUploaderComponent {

  onEmojiUpload(evt: any) {
    console.log(evt)
  }
}
