import { CommonModule } from '@angular/common'
import { AfterViewInit, Component, computed, ElementRef, HostListener, model, OnDestroy, output, signal, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatInputModule } from '@angular/material/input'
import { MatTooltipModule } from '@angular/material/tooltip'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { faCopy, faClock } from '@fortawesome/free-solid-svg-icons'
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
export class EmojiCollectionsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('emojiContainer')
  emojiElement!: ElementRef<HTMLElement>;

  readonly emojiWidth = 58;
  readonly maxRecents = 32;
  emojiPerRow = signal(4);

  // No point having a reference as a signal.
  includedCollections: Set<number> = new Set();
  includedCollectionsSize = signal<number>(0);
  filterText = model<string>('');

  // Computed upon changes to `includedCollectionsSize` and `filterText`
  emojiRenderable = computed<EmojiRow[]>(() => {
    const renderable: EmojiRow[] = [];

    // Our recent emojis are stored in local storage
    // -2 is our sentinel value for recents
    if (this.includedCollectionsSize() === 0 || this.includedCollections.has(-2)) {
      let recents = localStorage.getItem("recentEmoji");
      recents ??= "[]";
      let localEmos = JSON.parse(recents) as Emoji[];

      if (localEmos) {
        const header: EmojiRow = { tag: EmojiRenderType.Header, name: "Recent emojis", emos: [] };
        renderable.push(header);
        this.createEmojiRows(this.filterText(), localEmos, renderable, true);
      }
    }


    for (let i = 0; i < this.emojiCollections.length; i++) {
      // If we are not including any collections, we render everything!
      if (this.includedCollectionsSize() != 0 && !this.includedCollections.has(i)) continue;

      let collection = this.emojiCollections[i];

      // Create a element for this collection's header
      const header: EmojiRow = { tag: EmojiRenderType.Header, name: collection.name, emos: [] };
      renderable.push(header);
      this.createEmojiRows(this.filterText(), collection.emojis, renderable);
    }
    return renderable;
  });

  createEmojiRows(query: string, emojis: Emoji[], out: EmojiRow[], reverse: boolean = false) {
    let count = 1;
    let row = [];
    // Create elements for each row of emoji
    let i = reverse ? emojis.length - 1 : 0;
    for (; reverse ? i >= 0 : i < emojis.length; reverse ? i-- : i++) {
      let emoji = emojis[i];
      if (!query || emoji.name.toLowerCase().includes(this.filterText().toLowerCase())) {
        row.push(emoji);
        if (++count > this.emojiPerRow()) {
          const emojiRow: EmojiRow = { tag: EmojiRenderType.Row, emos: [...row], name: '' };
          out.push(emojiRow);
          count = 1;
          row = [];
        }
      }
    }
    // Our row might not have been added!
    if (row.length > 0) {
      const emojiRow: EmojiRow = { tag: EmojiRenderType.Row, emos: [...row], name: '' };
      out.push(emojiRow);
    }
  }

  copyIcon = faCopy
  clockIcon = faClock
  emojiCollections: EmojiCollection[] = []
  subscription: Subscription
  emoji = output<Emoji>()

  baseMediaUrl = EnvironmentService.environment.baseMediaUrl

  constructor(private postService: PostsService) {
    this.subscription = this.postService.updateFollowers.subscribe(() => {
      this.emojiCollections = this.postService.emojiCollections
    })
  }
  ngAfterViewInit(): void {
    this.updateDimensions();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  click(emoji: Emoji) {
    this.addToRecents(emoji);
    this.emoji.emit({
      id: emoji.id,
      name: emoji.url ? emoji.name : emoji.id,
      url: emoji.url,
      external: false
    })
  }

  addToRecents(emoji: Emoji) {
    let recents = localStorage.getItem("recentEmoji");
    recents ??= "[]";
    let emos = JSON.parse(recents) as Emoji[];
    let index = emos.findIndex((e) => { return emoji.name === e.name });
    if (index >= 0) {
      emos.push(emos.splice(index, 1)[0]);
    } else {
      emos.push(emoji);
    }
    if (emos.length > this.maxRecents) {
      emos.splice(0, 1);
    }
    localStorage.setItem("recentEmoji", JSON.stringify(emos));
  }

  toggleCollection(index: number) {
    // We use -1 as a sentinel value to indicate that "*" (all) was selected.
    if (index === -1) {
      this.includedCollections.clear();
      this.includedCollectionsSize.set(this.includedCollections.size);
      return;
    }

    // Otherwise, toggle the included collection. We explicitly track the size
    // as we do not mutate the reference to the hashmap.
    if (this.includedCollections.has(index)) {
      this.includedCollections.delete(index);
      this.includedCollectionsSize.set(this.includedCollections.size);
      return;
    }
    this.includedCollections.add(index);
    this.includedCollectionsSize.set(this.includedCollections.size);
  }

  collectionHas(index: number): boolean {
    // We use -1 as a sentinel value to indicate that "*" (all) was selected.
    if (index === -1) {
      return this.includedCollections.size === 0;
    }
    return this.includedCollections.has(index) && this.includedCollections.size != 0;
  }

  showCollection(collection: EmojiCollection): boolean {
    return collection.emojis.map((elem) => elem.name).some((elem) => elem.includes(this.filterText()))
  }

  updateDimensions() {
    this.emojiPerRow.set(this.emojiElement.nativeElement.offsetWidth / this.emojiWidth);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateDimensions();
  }
}
