import { CommonModule } from '@angular/common'
import { Component, computed, ElementRef, Input, OnChanges, OnDestroy, viewChild } from '@angular/core'
import { ProcessedPost } from '../../interfaces/processed-post'
import { PollModule } from '../poll/poll.module'
import { WafrnMediaModule } from '../wafrn-media/wafrn-media.module'
import { RouterModule } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { SimplifiedUser } from '../../interfaces/simplified-user'

import { MatTooltipModule } from '@angular/material/tooltip'
import { PostsService } from '../../services/posts.service'
import { LoginService } from '../../services/login.service'
import { JwtService } from '../../services/jwt.service'
import { EmojiReactComponent } from '../emoji-react/emoji-react.component'
import { MessageService } from '../../services/message.service'
import { Emoji } from '../../interfaces/emoji'
import { InjectHtmlModule } from '../../directives/inject-html/inject-html.module'
import { PostHeaderComponent } from '../post/post-header/post-header.component'
import { SingleAskComponent } from '../single-ask/single-ask.component'
import { EnvironmentService } from '../../services/environment.service'
import { WafrnMedia } from '../../interfaces/wafrn-media'

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
    SingleAskComponent
  ],
  templateUrl: './post-fragment.component.html',
  styleUrl: './post-fragment.component.scss'
})
export class PostFragmentComponent implements OnChanges, OnDestroy {
  @Input() fragment!: ProcessedPost
  showSensitiveContent = false
  emojiCollection: EmojiReaction[] = []
  likeSubscription
  emojiSubscription
  followsSubscription
  userId
  availableEmojiNames: string[] = []

  reactionLoading = false
  sanitizedContent = ''
  noTagsContent = ''
  wafrnFormattedContent: Array<string | WafrnMedia> = []
  characterCount = computed(() => this.noTagsContent.length)
  wordCount = computed(() => this.noTagsContent.split(' ').length)

  seenMedia: number[] = []

  readonly inlineMediaElement = viewChild<ElementRef<HTMLElement>>('mediaInline')
  readonly endMediaElement = viewChild<ElementRef<HTMLElement>>('mediaEnd')
  viewerInline: Viewer | undefined
  viewerEnd: Viewer | undefined

  constructor(
    private postService: PostsService,
    private loginService: LoginService,
    private jwtService: JwtService,
    private messages: MessageService
  ) {
    this.followsSubscription = this.postService.updateFollowers.subscribe(() => {
      this.availableEmojiNames = []
      this.postService.emojiCollections.forEach(
        (collection) =>
          (this.availableEmojiNames = this.availableEmojiNames.concat(collection.emojis.map((elem) => elem.name)))
      )
      this.availableEmojiNames.push('❤️')
    })
    this.userId = loginService.getLoggedUserUUID()
    this.likeSubscription = postService.postLiked.subscribe((likeEvent) => {
      if (likeEvent.id === this.fragment?.id) {
        this.renderLikeDislike(likeEvent)
      }
    })
    this.emojiSubscription = postService.emojiReacted.subscribe((emojiEvent) => {
      if (emojiEvent.postId === this.fragment?.id) {
        this.renderEmojiReact(emojiEvent)
      }
    })
  }

  ngOnDestroy(): void {
    this.likeSubscription.unsubscribe()
    this.emojiSubscription.unsubscribe()
    this.followsSubscription.unsubscribe()
  }

  ngOnChanges(): void {
    this.initializeContent()
    this.initializeEmojis()
  }

  initializeContent() {
    const disableCW = localStorage.getItem('disableCW') === 'true'
    this.showSensitiveContent = disableCW

    let processedBlock: Array<string | WafrnMedia> = []
    this.sanitizedContent = this.postService.getPostHtml(this.fragment)
    this.noTagsContent = this.postService.getPostHtml(this.fragment, [])
    if (this.fragment && this.fragment.medias && this.fragment.medias?.length > 0) {
      const mediaDetectorRegex = /\!\[media\-([0-9]+)]/gm
      const textDivided = this.sanitizedContent.split(mediaDetectorRegex)
      textDivided.forEach((elem, index) => {
        if (index % 2 == 0) {
          if (elem != '') {
            processedBlock.push(elem)
          }
        } else {
          const medias = this.fragment.medias as WafrnMedia[]
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
    this.wafrnFormattedContent = processedBlock
  }

  initializeEmojis() {
    // using a "map" here for O(1) get operations
    const emojiReactions = {} as Record<string, EmojiReaction>
    if (!this.fragment.emojiReactions) {
      this.emojiCollection = []
      return
    }
    this.fragment.emojiReactions.forEach((reaction) => {
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
      if (reaction.user?.avatar) {
        emojiReactions[reaction.content].users.push(reaction.user)
      }
    })

    this.emojiCollection = Object.values(emojiReactions)
      .sort(
        (a, b) =>
          +(this.availableEmojiNames.includes(b.name) || !b.img) -
          +(this.availableEmojiNames.includes(a.name) || !a.img)
      )
      .sort((a, b) => b.users.length - a.users.length)
    for (let emoji of this.emojiCollection) {
      emoji.tooltip = (this.isLike(emoji) ? 'Liked' : emoji.content) + ' by ' + this.getTooltipUsers(emoji.users)
      emoji.includesMe = this.emojiReactionIncludesMe(emoji)
    }
  }

  getTooltipUsers(users: SimplifiedUser[]): string {
    return users.map((usr) => usr.url).join(', ')
  }

  renderLikeDislike({ like }: { id: string; like: boolean }) {
    let likesCollection = this.emojiCollection.find((elem) => elem.id === 'Like')
    if (like) {
      // CODE TO ADD LIKE
      if (!likesCollection) {
        likesCollection = {
          id: '=',
          content: '❤️',
          external: false,
          img: undefined,
          name: '❤️',
          users: [],
          tooltip: '',
          includesMe: false
        }
        this.emojiCollection.push(likesCollection)
      }
      likesCollection.users.push({
        url: this.jwtService.getTokenData()['url'],
        name: this.jwtService.getTokenData()['url'],
        id: this.loginService.getLoggedUserUUID(),
        avatar: ''
      })
    } else {
      // CODE TO REMOVE LIKE
      if (likesCollection) {
        if (likesCollection.users.length === 1) {
          this.emojiCollection = this.emojiCollection.filter((col) => col.id !== 'Like')
        } else {
          likesCollection.users = likesCollection.users.filter(
            (usr) => usr.id !== this.loginService.getLoggedUserUUID()
          )
        }
      }
    }
  }

  renderEmojiReact({ emoji, type }: { postId: string; emoji: Emoji; type: 'react' | 'undo_react' }) {
    const collection = this.emojiCollection.find((e) => e.id === emoji.id)
    if (type === 'react') {
      this.fragment.emojiReactions.push({
        emojiId: emoji.id,
        emoji: emoji,
        userId: this.loginService.getLoggedUserUUID(),
        postId: this.fragment.id,
        content: emoji.name,
        user: {
          url: this.jwtService.getTokenData()['url'],
          name: this.jwtService.getTokenData()['url'],
          id: this.loginService.getLoggedUserUUID(),
          avatar: ''
        }
      })
      console.log(this.fragment.emojiReactions)
    } else {
      if (collection) {
        if (collection.users.length === 1) {
          this.emojiCollection = this.emojiCollection.filter((col) => col.id !== emoji.id)
        } else {
          collection.users = collection.users.filter((usr) => usr.id !== this.loginService.getLoggedUserUUID())
        }
      }
    }
    this.ngOnChanges()
  }

  isLike(emojiReaction: EmojiReaction) {
    return ['♥️', '❤'].includes(emojiReaction.content)
  }

  async toggleEmojiReact(emojiReaction: EmojiReaction) {
    if (this.fragment.userId === this.userId) {
      this.messages.add({
        severity: 'error',
        summary: `You can not emojireact to your own posts`
      })
      return
    }
    const postId = this.fragment.id
    if (!postId) {
      return
    }

    this.reactionLoading = true
    const reactionIsToggled = emojiReaction.users.some((usr) => usr.id === this.userId)

    if (this.isLike(emojiReaction)) {
      if (reactionIsToggled) {
        await this.postService.unlikePost(postId)
      } else {
        await this.postService.likePost(postId)
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
            summary: `Reacted with ${emojiReaction.name} successfully`
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

    this.reactionLoading = false
  }

  emojiReactionIncludesMe(emoji: EmojiReaction) {
    return emoji.users.some((usr) => usr.id === this.userId)
  }

  cwClick() {
    this.showSensitiveContent = !this.showSensitiveContent
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
      toggleOnDblclick: false
    })
  }
}
