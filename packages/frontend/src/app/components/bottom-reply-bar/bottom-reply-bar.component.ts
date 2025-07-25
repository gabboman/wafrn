import { Component, Input, OnChanges, signal, SimpleChanges } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatTooltipModule } from '@angular/material/tooltip'
import { RouterModule } from '@angular/router'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import {
  faArrowUpRightFromSquare,
  faBookBookmark,
  faBookmark,
  faCheck,
  faChevronDown,
  faClose,
  faEnvelope,
  faGlobe,
  faHeart,
  faHeartBroken,
  faPen,
  faQuoteLeft,
  faRepeat,
  faReply,
  faServer,
  faShareNodes,
  faTrash,
  faUnlock,
  faUser
} from '@fortawesome/free-solid-svg-icons'
import { firstValueFrom } from 'rxjs'
import { PostLinkModule } from 'src/app/directives/post-link/post-link.module'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { DeletePostService } from 'src/app/services/delete-post.service'
import { EditorService } from 'src/app/services/editor.service'
import { LoginService } from 'src/app/services/login.service'
import { MessageService } from 'src/app/services/message.service'
import { PostsService } from 'src/app/services/posts.service'

@Component({
  selector: 'app-bottom-reply-bar',
  imports: [RouterModule, FontAwesomeModule, MatButtonModule, MatTooltipModule, PostLinkModule],
  templateUrl: './bottom-reply-bar.component.html',
  styleUrl: './bottom-reply-bar.component.scss'
})
export class BottomReplyBarComponent implements OnChanges {
  @Input() fragment!: ProcessedPost
  @Input() post!: ProcessedPost[]
  @Input() notes: string = ''
  userLoggedIn = false
  isEmptyReblog = false
  myId = ''
  loadingAction = false
  myRewootsIncludePost = false
  bookmarked = signal<boolean>(false)

  // icons
  shareIcon = faShareNodes
  expandDownIcon = faChevronDown
  solidHeartIcon = faHeart
  clearHeartIcon = faHeartBroken
  reblogIcon = faReply
  quickReblogIcon = faRepeat
  quoteIcon = faQuoteLeft
  shareExternalIcon = faArrowUpRightFromSquare
  deleteIcon = faTrash
  closeIcon = faClose
  worldIcon = faGlobe
  unlockIcon = faUnlock
  envelopeIcon = faEnvelope
  serverIcon = faServer
  userIcon = faUser
  editedIcon = faPen
  checkIcon = faCheck
  bookmarkIcon = faBookmark
  unbookmarkIcon = faBookBookmark

  constructor(
    readonly loginService: LoginService,
    private readonly postService: PostsService,
    private readonly editorService: EditorService,
    private readonly deletePostService: DeletePostService,
    private readonly messages: MessageService,
    private readonly editor: EditorService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn()
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID()
    }
  }

  ngOnInit(): void {
    this.bookmarked.set(this.fragment.bookmarkers.includes(this.myId))
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.myRewootsIncludePost = this.postService.rewootedPosts.includes(this.fragment.id)

    const finalOne = this.fragment
    this.isEmptyReblog =
      this.fragment &&
      finalOne.content == '' &&
      finalOne.tags.length == 0 &&
      finalOne.quotes.length == 0 &&
      !finalOne.questionPoll &&
      finalOne.medias?.length == 0
  }

  async replyPost(post: ProcessedPost) {
    await this.editorService.replyPost(post)
  }

  async quotePost(post: ProcessedPost) {
    await this.editorService.quotePost(post)
  }

  async editPost(post: ProcessedPost) {
    await this.editorService.replyPost(post, true)
  }

  async deletePost(id: string) {
    this.deletePostService.openDeletePostDialog(id)
  }

  async deleteRewoots(id: string) {
    this.loadingAction = true
    const success = await firstValueFrom(this.deletePostService.deleteRewoots(id))
    if (success) {
      this.myRewootsIncludePost = false
      this.messages.add({
        severity: 'success',
        summary: 'You successfully deleted your rewoot'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong! Check your internet connectivity and try again'
      })
    }
    this.loadingAction = false
  }

  async likePost(postToLike: ProcessedPost) {
    this.loadingAction = true
    if (await this.postService.likePost(postToLike.id)) {
      postToLike.userLikesPostRelations.push(this.myId)
      const disableConfetti = localStorage.getItem('disableConfetti') == 'true'
      this.messages.add({
        severity: 'success',
        summary: 'You successfully liked this woot',
        confettiEmojis: disableConfetti ? [] : ['❤️', '💚', '💙'],
        soundUrl: '/assets/sounds/1.ogg'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
    this.loadingAction = false
  }

  async unlikePost(postToUnlike: ProcessedPost) {
    this.loadingAction = true
    if (await this.postService.unlikePost(postToUnlike.id)) {
      postToUnlike.userLikesPostRelations = postToUnlike.userLikesPostRelations.filter((elem) => elem != this.myId)
      this.messages.add({
        severity: 'success',
        summary: 'You no longer like this woot'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
    this.loadingAction = false
  }
  async unbookmarkPost() {
    if (await this.postService.unbookmarkPost(this.fragment.id)) {
      this.fragment.bookmarkers = this.fragment.bookmarkers.filter((elem) => elem != this.myId)
      this.messages.add({
        severity: 'success',
        summary: 'You successfully unbookmarked this woot'
      })
      this.bookmarked.set(false)
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
  }
  async bookmarkPost() {
    if (await this.postService.bookmarkPost(this.fragment.id)) {
      this.fragment.bookmarkers.push(this.myId)
      const disableConfetti = localStorage.getItem('disableConfetti') == 'true'
      this.messages.add({
        severity: 'success',
        summary: 'You successfully bookmarked this woot',
        confettiEmojis: disableConfetti ? [] : ['💾']
      })
      this.bookmarked.set(true)
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
  }

  async quickReblog(postToBeReblogged: ProcessedPost) {
    this.loadingAction = true
    if (postToBeReblogged?.privacy !== 10) {
      const response = await this.editor.createPost({
        mentionedUsers: [],
        content: '',
        idPostToReblog: postToBeReblogged.id,
        privacy: 0,
        media: []
      })
      if (response) {
        const disableConfetti = localStorage.getItem('disableConfetti') == 'true'

        this.myRewootsIncludePost = true
        this.messages.add({
          severity: 'success',
          summary: 'You rewooted the woot!',
          confettiEmojis: disableConfetti ? [] : ['🔁'],
          soundUrl: '/assets/sounds/2.ogg'
        })
      }
    } else {
      this.messages.add({
        severity: 'warn',
        summary: 'Sorry, this woot is not rebloggeable as requested by the user'
      })
    }
    this.loadingAction = false
  }
}
