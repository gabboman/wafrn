import { CommonModule } from '@angular/common'
import { Component, computed, EventEmitter, model, OnDestroy, Output, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatInputModule } from '@angular/material/input'
import { MatTooltipModule } from '@angular/material/tooltip'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import { Subscription } from 'rxjs'
import { Emoji } from '../../interfaces/emoji'
import { EmojiCollection } from '../../interfaces/emoji-collection'
import { EnvironmentService } from '../../services/environment.service'
import { PostsService } from '../../services/posts.service'
import { ScrollingModule } from '@angular/cdk/scrolling';

export enum EmojiRenderType {
  Header,
  Row,
};

export interface EmojiRow {
  tag: EmojiRenderType,
  emos: Emoji[],
  name: string,
};

@Component({
  selector: 'app-emoji-collections',
  imports: [
    CommonModule,
    MatButtonModule,
    FontAwesomeModule,
    FormsModule,
    MatInputModule,
    MatTooltipModule,
    MatExpansionModule,
    ScrollingModule
  ],
  templateUrl: './emoji-collections.component.html',
  styleUrl: './emoji-collections.component.scss',
})
export class EmojiCollectionsComponent implements OnDestroy {
  private static readonly emoji_per_row = 4;

  // No point having a reference as a signal.
  includedCollections: Set<number> = new Set();
  includedCollectionsSize = signal<number>(0);

  emojiRenderable = computed<EmojiRow[]>(() => {
    const renderable: EmojiRow[] = [];

    for (let i = 0; i < this.emojiCollections.length; i++) {
      if (this.includedCollectionsSize() != 0 && !this.includedCollections.has(i)) continue;
      let collection = this.emojiCollections[i];
      // Create a element for this collection's header
      const header: EmojiRow = { tag: EmojiRenderType.Header, name: collection.name, emos: [] };
      renderable.push(header);
      let count = 1;
      let row: Emoji[] = [];
      // Create elements for each row of emoji
      for (let emoji of collection.emojis) {
        if (emoji.name.toLowerCase().includes(this.filterText().toLowerCase())) {
          row.push(emoji);
          if (++count > EmojiCollectionsComponent.emoji_per_row) {
            const emojiRow: EmojiRow = { tag: EmojiRenderType.Row, emos: [...row], name: '' };
            renderable.push(emojiRow);
            count = 1;
            row = [];
          }
        }
      }
    }
    return renderable;
  });
  copyIcon = faCopy
  filterText = model<string>('');
  emojiCollections: EmojiCollection[] = []
  subscription: Subscription
  @Output() emoji: EventEmitter<Emoji> = new EventEmitter<Emoji>()

  baseMediaUrl = EnvironmentService.environment.baseMediaUrl

  constructor(private postService: PostsService) {
    this.subscription = this.postService.updateFollowers.subscribe(() => {
      this.emojiCollections = this.postService.emojiCollections
    })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  click(emoji: Emoji) {
    this.emoji.emit({
      id: emoji.id,
      name: emoji.url ? emoji.name : emoji.id,
      url: emoji.url,
      external: false
    })
  }

  toggleCollection(index: number) {
    if (this.includedCollections.has(index)) {
      this.includedCollections.delete(index);
      this.includedCollectionsSize.set(this.includedCollections.size);
      return;
    }
    this.includedCollections.add(index);
    this.includedCollectionsSize.set(this.includedCollections.size);
  }

  collectionHas(index: number): boolean {
    if (index < 0) {
      return this.includedCollections.size === 0;
    }
    return this.includedCollections.has(index) && this.includedCollections.size != 0;
  }

  showCollection(collection: EmojiCollection): boolean {
    return collection.emojis.map((elem) => elem.name).some((elem) => elem.includes(this.filterText()))
  }
}
