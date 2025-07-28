import { Component, inject } from '@angular/core'
import { DialogRef } from '@angular/cdk/dialog'
import { EmojiCollectionsComponent } from '../emoji-collections/emoji-collections.component'
import { Emoji } from 'src/app/interfaces/emoji'

import { MatButtonModule } from '@angular/material/button'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'

@Component({
  selector: 'app-emoji-picker',
  imports: [EmojiCollectionsComponent, MatButtonModule, FontAwesomeModule],
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
