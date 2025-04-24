import { CommonModule } from '@angular/common'
import { Component, inject, input } from '@angular/core'
import { Overlay, OverlayModule } from '@angular/cdk/overlay'
import { MatButtonModule } from '@angular/material/button'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { PostsService } from '../../services/posts.service'
import { MessageService } from '../../services/message.service'
import { MatTooltipModule } from '@angular/material/tooltip'
import { Emoji } from '../../interfaces/emoji'
import { Dialog } from '@angular/cdk/dialog'
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component'

@Component({
  selector: 'app-emoji-react',
  imports: [CommonModule, MatButtonModule, FontAwesomeModule, OverlayModule, MatTooltipModule],
  templateUrl: './emoji-react.component.html',
  styleUrl: './emoji-react.component.scss'
})
export class EmojiReactComponent {
  scrollStrategy
  dialog = inject(Dialog)
  readonly postId = input<string>('')
  isOpen = false
  loading = false

  constructor(
    private overlay: Overlay,
    private postsService: PostsService,
    private messages: MessageService
  ) {
    this.scrollStrategy = this.overlay.scrollStrategies.reposition()
  }
  openDialog(): void {
    const dialogRef = this.dialog.open<Emoji>(EmojiPickerComponent, {
      autoFocus: false
    });

    dialogRef.closed.subscribe((result) => {
      if (result) {
        this.reactToPost(result)
      }
    })
  }

  async reactToPost(emoji: Emoji) {
    this.loading = true
    const response = await this.postsService.emojiReactPost(this.postId(), emoji.name)
    if (response) {
      const disableConfetti = localStorage.getItem('disableConfetti') == 'true'
      this.messages.add({
        severity: 'success',
        summary: `Reacted with ${emoji.name} succesfully`,
        confettiEmojis: !disableConfetti && !emoji.url ? [] : [emoji.name]
      })
      this.isOpen = false
      this.loading = false
    } else {
      this.messages.add({
        severity: 'error',
        summary: `Something went wrong!`
      })
      this.loading = false
    }
  }
}
