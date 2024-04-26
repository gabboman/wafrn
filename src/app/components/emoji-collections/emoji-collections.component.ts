import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { Emoji } from 'src/app/interfaces/emoji';
import { EmojiCollection } from 'src/app/interfaces/emoji-collection';
import { MessageService } from 'src/app/services/message.service';
import { PostsService } from 'src/app/services/posts.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-emoji-collections',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, FontAwesomeModule, FormsModule, MatInputModule
  ],
  templateUrl: './emoji-collections.component.html',
  styleUrl: './emoji-collections.component.scss'
})
export class EmojiCollectionsComponent implements OnDestroy{
  copyIcon = faCopy;
  filterText = "";
  emojiCollections: EmojiCollection[] = []
  subscription: Subscription;

  baseMediaUrl = environment.baseMediaUrl

  constructor(private postService: PostsService, private messages: MessageService) {
    this.subscription = this.postService.updateFollowers.subscribe(() => {
      this.emojiCollections = this.postService.emojiCollections
    })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  copyEmoji(emoji: Emoji) {
    navigator.clipboard.writeText(
      emoji.name
    );
    this.messages.add({
      severity: 'success',
      summary: `The emoji ${emoji.name} was copied to your clipboard`,
    });
  }

}
