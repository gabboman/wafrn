import { Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { EmojiCollectionsComponent } from '../emoji-collections/emoji-collections.component';
import { Emoji } from 'src/app/interfaces/emoji';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-emoji-react',
  imports: [
    CommonModule,
    EmojiCollectionsComponent,
  ],
  styleUrl: './emoji-picker.component.scss',
  templateUrl: './emoji-picker.component.html',
})
export class EmojiPickerComponent {
  dialogRef = inject<DialogRef<Emoji>>(DialogRef<Emoji>);

  reactToPost(e: Emoji) {
    this.dialogRef.close(e);
  }
}
