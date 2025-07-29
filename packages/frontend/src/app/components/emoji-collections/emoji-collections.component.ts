import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  model,
  OnDestroy,
  output,
  signal,
  ViewChild
} from '@angular/core'
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
import { ScrollingModule } from '@angular/cdk/scrolling'

enum EmojiRenderType {
  Header,
  Row
}

@Component({
  selector: 'app-emoji-collections',
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    FormsModule,
    MatInputModule,
    MatTooltipModule,
    MatExpansionModule,
    ScrollingModule
  ],
  templateUrl: './emoji-collections.component.html',
  styleUrl: './emoji-collections.component.scss'
})
export class EmojiCollectionsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('emojiContainer')
  emojiElement!: ElementRef<HTMLElement>

  readonly emojiWidth = 55
  readonly rowMargin = 16
  readonly maxRecents = 32
  readonly narrow = 800

  virtualHeight = signal(400)

  vcRows = computed<VirtualRows>(() => {
    let recentEmoji: Emoji[] = []
    let filteredRecents: Emoji[] = []
    let filteredCollections: EmojiCollection[] = []

    // Our recent emojis are stored in local storage
    // -2 is our sentinel value for recents
    if (this.includedCollectionsSize() == 0 || this.includedCollections.has(-2)) {
      let recents = localStorage.getItem('recentEmoji')
      recents ??= '[]'
      recentEmoji = JSON.parse(recents) as Emoji[]

      if (recentEmoji) {
        recentEmoji.reverse()
      } else {
        recentEmoji = []
      }
      for (let r of recentEmoji) {
        if (r.name.toLowerCase().includes(this.filterText().toLowerCase())) {
          filteredRecents.push(r)
        }
      }
    }

    // If we don't need to manipulate arrays, don't!
    if (this.filterText() == '' && this.includedCollectionsSize() == 0) {
      return new VirtualRows(recentEmoji, this.emojiCollections, this.emojiPerRow())
    }

    for (let i = 0; i < this.emojiCollections.length; i++) {
      let c = this.emojiCollections[i]
      let newCollection: EmojiCollection = { name: c.name, comment: c.comment, emojis: [] }
      if (this.includedCollectionsSize() == 0 || this.includedCollections.has(i)) {
        for (let e of this.emojiCollections[i].emojis) {
          if (e.name.toLowerCase().includes(this.filterText().toLowerCase())) {
            newCollection.emojis.push(e)
          }
        }
        if (newCollection.emojis.length > 0) {
          filteredCollections.push(newCollection)
        }
      }
    }

    // Force load collections (optimization or something)
    if (this.includedCollections.size > 1) {
      for (let i = 0; i < 5; i++) {
        filteredCollections.push({ name: '', comment: '', emojis: [] })
      }
    }
    return new VirtualRows(filteredRecents, filteredCollections, this.emojiPerRow())
  })

  // No point having a reference as a signal.
  includedCollections: Set<number> = new Set()
  includedCollectionsSize = signal<number>(0)
  emojiPerRow = signal(4)
  filterText = model<string>('')

  rowIterable = computed<AngularFor>(() => {
    const emojiModifier = window.innerWidth < this.narrow ? 0 : -1
    return new AngularFor(this.emojiPerRow() + emojiModifier)
  })

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
    this.updateDimensions()
    this.toggleCollection(-1)
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  click(emoji: Emoji) {
    this.addToRecents(emoji)
    this.emoji.emit({
      id: emoji.id,
      name: emoji.url ? emoji.name : emoji.id,
      url: emoji.url,
      external: false
    })
  }

  addToRecents(emoji: Emoji) {
    let recents = localStorage.getItem('recentEmoji')
    recents ??= '[]'
    let emos = JSON.parse(recents) as Emoji[]
    let index = emos.findIndex((e) => {
      return emoji.name === e.name
    })
    if (index >= 0) {
      emos.push(emos.splice(index, 1)[0])
    } else {
      emos.push(emoji)
    }
    if (emos.length > this.maxRecents) {
      emos.splice(0, 1)
    }
    localStorage.setItem('recentEmoji', JSON.stringify(emos))
  }

  toggleCollection(index: number) {
    // We use -1 as a sentinel value to indicate that "*" (all) was selected.
    if (index === -1) {
      this.includedCollections.clear()
      this.includedCollectionsSize.set(this.includedCollections.size)
      return
    }
    // me when I delete code
    if (this.includedCollections.has(index)) {
      this.includedCollections.delete(index)
      this.includedCollectionsSize.set(this.includedCollections.size)
      return
    }
    this.includedCollections.clear()
    this.includedCollectionsSize.set(this.includedCollections.size)
    this.includedCollections.add(index)
    this.includedCollectionsSize.set(this.includedCollections.size)
  }

  collectionHas(index: number): boolean {
    // We use -1 as a sentinel value to indicate that "*" (all) was selected.
    if (index === -1) {
      return this.includedCollections.size === 0
    }
    return this.includedCollections.has(index) && this.includedCollections.size != 0
  }

  showCollection(collection: EmojiCollection): boolean {
    return collection.emojis.map((elem) => elem.name).some((elem) => elem.includes(this.filterText()))
  }

  updateDimensions() {
    const emojiFreeWidth = this.emojiElement.nativeElement.offsetWidth - 2 * this.rowMargin
    this.emojiPerRow.set(Math.max(Math.floor(emojiFreeWidth / this.emojiWidth) - 1, 1))
    this.virtualHeight.set(window.innerWidth < this.narrow ? 700 : 400)
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateDimensions()
  }
}

interface EmojiRenderable {
  tag: number
  index: number
  array: Emoji[]
  name: string
  count?: number
}

// I can't believe all solutions to this problem online are "Make and populate a new array!"
class AngularFor implements Iterable<number> {
  private readonly length: number
  constructor(length: number) {
    this.length = length
  }
  [Symbol.iterator](): Iterator<number> {
    let count = 0
    return {
      next: () => {
        return {
          done: count > this.length,
          value: count++
        }
      }
    }
  }
}

class VirtualRows implements Iterable<EmojiRenderable> {
  private readonly recents: Emoji[]
  private readonly collections: EmojiCollection[]
  private readonly perRow: number

  constructor(recents: Emoji[], collections: EmojiCollection[], perRow: number) {
    this.recents = recents
    this.collections = collections
    this.perRow = perRow
  }

  [Symbol.iterator](): Iterator<EmojiRenderable> {
    let collection = this.recents.length > 0 ? -1 : 0
    let row = 0
    let headerResolved = false
    let skipNext = false
    let index = 0
    return {
      next: () => {
        if (!skipNext) {
          index = row * this.perRow
          row++
          if (index >= (collection == -1 ? this.recents.length : this.collections[collection].emojis.length)) {
            headerResolved = false
            collection++
            row = 1
            index = 0
          }
        }
        skipNext = false

        if (!headerResolved) {
          headerResolved = true
          skipNext = true
          return {
            done: (collection >= this.collections.length) as true,
            value: {
              tag: EmojiRenderType.Header,
              name:
                collection == -1
                  ? 'Recent emojis'
                  : this.collections[Math.min(collection, this.collections.length - 1)]?.name,
              index: 0,
              array: [],
              count:
                collection == -1
                  ? undefined
                  : this.collections[Math.min(collection, this.collections.length - 1)]?.emojis.length
            }
          }
        }

        return {
          done: (collection >= this.collections.length) as true, // wtf is this typescript
          value: {
            tag: EmojiRenderType.Row,
            index: index,
            array:
              collection == -1
                ? this.recents
                : this.collections[Math.min(collection, this.collections.length - 1)].emojis
          }
        }
      }
    }
  }
}
