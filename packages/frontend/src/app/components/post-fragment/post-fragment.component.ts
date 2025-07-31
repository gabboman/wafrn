import { CommonModule } from '@angular/common'
import { Component, computed, ElementRef, input, OnChanges, OnDestroy, output, signal, viewChild } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { RouterModule } from '@angular/router'
import { ProcessedPost } from '../../interfaces/processed-post'
import { SimplifiedUser } from '../../interfaces/simplified-user'
import { PollModule } from '../poll/poll.module'
import { WafrnMediaModule } from '../wafrn-media/wafrn-media.module'

import { MatTooltipModule } from '@angular/material/tooltip'
import { InjectHtmlModule } from '../../directives/inject-html/inject-html.module'
import { Emoji } from '../../interfaces/emoji'
import { WafrnMedia } from '../../interfaces/wafrn-media'
import { EnvironmentService } from '../../services/environment.service'
import { JwtService } from '../../services/jwt.service'
import { LoginService } from '../../services/login.service'
import { MessageService } from '../../services/message.service'
import { PostsService } from '../../services/posts.service'
import { EmojiReactComponent } from '../emoji-react/emoji-react.component'
import { PostHeaderComponent } from '../post/post-header/post-header.component'
import { SingleAskComponent } from '../single-ask/single-ask.component'

import { TranslateModule } from '@ngx-translate/core'

import { Subscription } from 'rxjs'
import { PostLinkModule } from 'src/app/directives/post-link/post-link.module'
import Viewer from 'viewerjs'

type EmojiReaction = {
  id: string
  content: string
  img?: string
  external: boolean
  name: string
  users: SimplifiedUser[]
  tooltip: string
  includesMe: boolean
}

@Component({
  selector: 'app-post-fragment',
  imports: [
    CommonModule,
    PollModule,
    WafrnMediaModule,
    RouterModule,
    MatButtonModule,
    MatTooltipModule,
    EmojiReactComponent,
    InjectHtmlModule,
    PostHeaderComponent,
    SingleAskComponent,
    PostLinkModule,
    TranslateModule
  ],
  templateUrl: './post-fragment.component.html',
  styleUrl: './post-fragment.component.scss'
})
export class PostFragmentComponent implements OnChanges, OnDestroy {
  fragment = input.required<ProcessedPost>()
  forceExpand = output<boolean>()
  showSensitiveContent = signal<boolean>(false)
  emojiCollection = signal<EmojiReaction[]>([])
  isLocalUser = true
  likeSubscription!: Subscription
  emojiSubscription!: Subscription
  followsSubscription!: Subscription
  userId: string
  mentionPosts: string[] = []
  availableEmojiNames: string[] = []

  userCannotReact = computed<boolean>(() => {
    const ownPost = this.fragment().userId === this.userId
    return this.reactionLoading() || ownPost
  })

  reactionLoading = signal<boolean>(false)
  sanitizedContent = ''
  noTagsContent = ''
  wafrnFormattedContent = computed(() => {
    let processedBlock: Array<string | WafrnMedia> = []
    this.sanitizedContent = this.postService.getPostHtml(this.fragment())
    // wafrn silly feature
    if (localStorage.getItem('replaceAIWithCocaine') === 'true') {
      // TODO this should be done in a better way but because we are playing with html... AAAA
      const replaceAIWord = localStorage.getItem('replaceAIWord')
        ? JSON.parse(localStorage.getItem('replaceAIWord') as string)
        : 'cocaine'
      const wordsToReplace = [
        'ai',
        'artificial intelligence',
        'artificial inteligence',
        'llm',
        'intelligence artificielle',
        'ia'
      ]
      let regexpString = wordsToReplace.map((elem) => `\\s${elem}\\s|^${elem}\\s|${elem}$`).join('|')
      let regexp = new RegExp(regexpString, 'gi')
      this.sanitizedContent = this.sanitizedContent.replaceAll(regexp, ` ${replaceAIWord} `)
      regexpString = wordsToReplace.map((elem) => `>${elem} `).join('|')
      regexp = new RegExp(regexpString, 'gi')
      this.sanitizedContent = this.sanitizedContent.replaceAll(regexp, `>${replaceAIWord} `)
      regexpString = wordsToReplace.map((elem) => ` ${elem}<`).join('|')
      regexp = new RegExp(regexpString, 'gi')
      this.sanitizedContent = this.sanitizedContent.replaceAll(regexp, ` ${replaceAIWord}<`)
      regexpString = wordsToReplace.map((elem) => `>${elem}<`).join('|')
      regexp = new RegExp(regexpString, 'gi')
      this.sanitizedContent = this.sanitizedContent.replaceAll(regexp, `>${replaceAIWord}<`)
    }
    this.noTagsContent = this.postService.getPostHtml(this.fragment(), [])
    if (this.fragment().medias && this.fragment().medias?.length > 0) {
      const mediaDetectorRegex = /\!\[media\-([0-9]+)]/gm
      const textDivided = this.sanitizedContent.split(mediaDetectorRegex)
      textDivided.forEach((elem, index) => {
        if (index % 2 == 0) {
          if (elem != '') {
            processedBlock.push(elem)
          }
        } else {
          const medias = this.fragment().medias as WafrnMedia[]
          const mediaToInsert = medias[parseInt(elem) - 1]
          if (mediaToInsert) {
            processedBlock.push(mediaToInsert)
            this.seenMedia.push(parseInt(elem) - 1)
          } else {
            processedBlock.push(`![media-${elem}]`)
          }
        }
      })
    } else {
      processedBlock = [this.sanitizedContent]
    }
    return processedBlock
  })
  characterCount = computed(() => this.noTagsContent.length)
  wordCount = computed(() => this.noTagsContent.split(' ').length)

  seenMedia: number[] = []

  readonly inlineMediaElement = viewChild<ElementRef<HTMLElement>>('mediaInline')
  readonly endMediaElement = viewChild<ElementRef<HTMLElement>>('mediaEnd')
  viewerInline: Viewer | undefined
  viewerEnd: Viewer | undefined

  forceOldMediaStyle = localStorage.getItem('forceClassicMediaView') == 'true'
  expandQuotes = localStorage.getItem('expandQuotes') == 'true'

  nonLinkMediaCount = 0

  constructor(
    private postService: PostsService,
    private loginService: LoginService,
    private jwtService: JwtService,
    private readonly messages: MessageService
  ) {
    this.userId = this.loginService.getLoggedUserUUID()
  }

  ngOnDestroy(): void {
    this.likeSubscription.unsubscribe()
    this.emojiSubscription.unsubscribe()
    this.followsSubscription.unsubscribe()
  }

  ngOnInit(): void {
    this.followsSubscription = this.postService.updateFollowers.subscribe(() => {
      this.availableEmojiNames = []
      this.postService.emojiCollections.forEach(
        (collection) =>
          (this.availableEmojiNames = this.availableEmojiNames.concat(collection.emojis.map((elem) => elem.name)))
      )
      this.availableEmojiNames.push('❤️')
    })
    this.likeSubscription = this.postService.postLiked.subscribe((likeEvent) => {
      if (likeEvent.id === this.fragment()?.id) {
        this.renderLikeDislike(likeEvent)
      }
    })
    this.emojiSubscription = this.postService.emojiReacted.subscribe((emojiEvent) => {
      if (emojiEvent.postId === this.fragment()?.id) {
        this.renderEmojiReact(emojiEvent)
      }
    })
    const mentions = this.fragment().mentionPost
    let content = this.postService.getPostHtml(this.fragment(), []).toLowerCase()

    if (mentions) {
      this.mentionPosts = mentions
        .filter((usr) => {
          // This will always get us @user if local user, @uswer without the instance if fedi, or @user.bsky.app
          let userUrl = '@' + (usr.url.split('@').length == 1 ? usr.url : usr.url.split('@')[1]).toLowerCase()
          // If we are mentioning @user@instance1 and  @user@instance2 as @user @user this will fail. Its an edge case.
          // this could fail. kinda. in some situation. a very edge case. I think we will see one or two cases a year of this issue
          return !content.includes(userUrl) && usr.url != this.fragment().user.url
        })
        .map((user) => user.url)
    }

    this.initializeContent()
  }

  ngOnChanges(): void {
    this.initializeEmojis()
    this.nonLinkMediaCount = this.fragment().medias.filter((elem) => elem.mediaType != 'text/html').length
  }

  initializeContent() {
    const disableCW = localStorage.getItem('disableCW') === 'true'
    this.showSensitiveContent.set(disableCW)
  }

  initializeEmojis() {
    // using a "map" here for O(1) get operations
    const emojiReactions = {} as Record<string, EmojiReaction>
    if (!this.fragment().emojiReactions) {
      this.emojiCollection.set([])
      return
    }

    // Evil fix for bsky emoji text heart reactions
    this.fragment().emojiReactions.forEach((reaction) => {
      if (this.isLike(reaction.content)) {
        reaction.content = '♥️'
      }
    })

    this.fragment().emojiReactions.forEach((reaction) => {
      const hasReaction = !!emojiReactions[reaction.content]
      if (!hasReaction) {
        let image = ''
        if (reaction.emoji?.url) {
          image = encodeURIComponent(
            reaction.emoji.external
              ? reaction.emoji.url
              : EnvironmentService.environment.baseMediaUrl + reaction.emoji.url
          )
        }
        // create the basic structure to augment later
        emojiReactions[reaction.content] = {
          id: reaction.emojiId,
          content: reaction.content,
          external: reaction.emoji?.external == true,
          name: reaction.content,
          img: image ? `${EnvironmentService.environment.externalCacheurl}${image}` : undefined,
          users: [], // this will be filled below,
          tooltip: '',
          includesMe: false
        }
      }

      // at this point the current reaction is always defined on the map
      // so we can always access it to increment the users array
      if (reaction.user !== undefined) {
        emojiReactions[reaction.content].users.push(reaction.user)
      }
    })

    this.emojiCollection.set(Object.values(emojiReactions))
    this.processEmojis()
  }

  processEmojis() {
    for (let emoji of this.emojiCollection()) {
      emoji.tooltip =
        (this.isLike(emoji.content) ? 'Liked' : emoji.content) + ' by ' + this.getTooltipUsers(emoji.users)
      emoji.includesMe = this.emojiReactionIncludesMe(emoji)
    }
    this.emojiCollection.set(
      this.emojiCollection()
        .sort(
          (a, b) =>
            +(this.availableEmojiNames.includes(b.name) || !b.img) -
            +(this.availableEmojiNames.includes(a.name) || !a.img)
        )
        .sort((a, b) => +(b.id === 'Like') - +(a.id === 'Like'))
        .sort((a, b) => b.users.length - a.users.length)
    )
  }

  getTooltipUsers(users: SimplifiedUser[]): string {
    return users.map((usr) => usr.url).join(', ')
  }

  renderLikeDislike({ like }: { id: string; like: boolean }) {
    if (like) {
      this.fragment().emojiReactions.push({
        content: '♥️',
        emojiId: 'Like',
        postId: this.fragment().id,
        user: this.createUserObject(),
        userId: this.userId
      })
    } else {
      // Remove it from the fragment
      this.fragment().emojiReactions = this.fragment().emojiReactions.filter((e) => {
        return !(e.emojiId === 'Like' && e.userId === this.userId)
      })
    }
    this.initializeEmojis()
  }

  renderEmojiReact({ emoji, type }: { postId: string; emoji: Emoji; type: 'react' | 'undo_react' }) {
    const collectionIndex = this.emojiCollection().findIndex((e) =>
      e?.id ? e.id === emoji.id : e.content === emoji.name
    )
    const collection = this.emojiCollection()[collectionIndex]
    if (type === 'react') {
      this.fragment().emojiReactions.push({
        emojiId: emoji.id,
        emoji: emoji,
        userId: this.loginService.getLoggedUserUUID(),
        postId: this.fragment().id,
        content: emoji.name,
        user: this.createUserObject()
      })
    } else {
      if (collection) {
        if (collection.users.length === 1) {
          this.emojiCollection.update((ec) => {
            return ec.filter((col) => col.id !== emoji.id)
          })
        } else {
          collection.users = collection.users.filter((usr) => usr.id !== this.userId)
        }
      }
      // Remove it from the fragment
      this.fragment().emojiReactions = this.fragment().emojiReactions.filter((e) => {
        return !(e.emojiId === emoji.id && e.userId === this.userId)
      })
    }
    this.emojiCollection.update((e) => {
      return e
    })
    this.initializeEmojis()
  }

  isLike(emojiReaction: string) {
    return ['♥️', '❤', '♥'].includes(emojiReaction)
  }

  async toggleEmojiReact(emojiReaction: EmojiReaction) {
    if (this.fragment().userId === this.userId) {
      this.messages.add({
        severity: 'error',
        summary: `You can not emojireact to your own posts`
      })
      return
    }
    const postId = this.fragment().id
    if (!postId) {
      return
    }

    this.reactionLoading.set(true)
    const reactionIsToggled = emojiReaction.users.some((usr) => usr.id === this.userId)
    if (this.isLike(emojiReaction.content)) {
      if (reactionIsToggled) {
        await this.postService.unlikePost(postId)
      } else {
        await this.postService.likePost(postId)
        const disableConfetti = localStorage.getItem('disableConfetti') == 'true'
        this.messages.add({
          severity: 'success',
          summary: 'You successfully liked this woot',
          confettiEmojis: disableConfetti ? [] : ['❤️', '💚', '💙'],
          soundUrl: '/assets/sounds/1.ogg'
        })
      }
    } else {
      let response = false
      if (reactionIsToggled) {
        response = await this.postService.emojiReactPost(postId, emojiReaction.content, true)
        if (response) {
          this.messages.add({
            severity: 'success',
            summary: `Reaction removed successfully`
          })
        }
      } else {
        response = await this.postService.emojiReactPost(postId, emojiReaction.content)
        if (response) {
          this.messages.add({
            severity: 'success',
            summary: `Reacted with ${emojiReaction.name} successfully`,
            soundUrl: '/assets/sounds/1.ogg'
          })
        }
      }

      if (!response) {
        this.messages.add({
          severity: 'error',
          summary: `Something went wrong!`
        })
      }
    }

    this.reactionLoading.set(false)
    this.processEmojis()
  }

  emojiReactionIncludesMe(emoji: EmojiReaction) {
    return emoji.users.some((usr) => usr.id === this.userId)
  }

  cwClick() {
    this.forceExpand.emit(true)
    this.showSensitiveContent.set(!this.showSensitiveContent())
  }

  ngAfterViewInit(): void {
    this.viewerInline = this.attachViewer(this.inlineMediaElement())
    this.viewerEnd = this.attachViewer(this.endMediaElement())
  }

  attachViewer(container: ElementRef<HTMLElement> | undefined) {
    if (!container) return

    return new Viewer(container.nativeElement, {
      button: true,
      navbar: true,
      slideOnTouch: false,
      toolbar: {
        zoomIn: true,
        zoomOut: true,
        oneToOne: true,
        reset: true,
        prev: true,
        play: false,
        next: true,
        rotateLeft: false,
        rotateRight: false,
        flipHorizontal: false,
        flipVertical: false
      },
      title: false,
      className: 'viewer',
      filter(image: HTMLImageElement) {
        return !image.classList.contains('no-viewer')
      },
      toggleOnDblclick: false
    })
  }

  createUserObject() {
    return {
      url: this.jwtService.getTokenData()['url'],
      name: this.jwtService.getTokenData()['url'],
      id: this.loginService.getLoggedUserUUID(),
      avatar: ''
    }
  }
}
