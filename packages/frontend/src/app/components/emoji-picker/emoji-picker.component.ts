import { Component, inject } from '@angular/core'
import { DialogRef } from '@angular/cdk/dialog'
import { EmojiCollectionsComponent } from '../emoji-collections/emoji-collections.component'
import { Emoji } from 'src/app/interfaces/emoji'

import { MatButtonModule } from '@angular/material/button'

@Component({
  selector: 'app-emoji-picker',
  imports: [
    EmojiCollectionsComponent,
    MatButtonModule
],
  styleUrl: './emoji-picker.component.scss',
  templateUrl: './emoji-picker.component.html'
})
export class EmojiPickerComponent {
  dialogRef = inject<DialogRef<Emoji>>(DialogRef<Emoji>)
  faClose = faXmark

  reactToPost(e: Emoji) {
    this.dialogRef.close(e)
  }

  closeDialog() {
    this.dialogRef.close()
  }
}
