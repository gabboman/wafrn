import { Component, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core'
import { ProcessedPost } from '../../interfaces/processed-post'
import { MessageService } from '../../services/message.service'

import {
  faArrowUpRightFromSquare,
  faChevronDown,
  faHeart,
  faHeartBroken,
  faShareNodes,
  faTrash,
  faTriangleExclamation,
  faPen,
  faBellSlash,
  faBell,
  faReply,
  faRepeat,
  faQuoteLeft,
  faGlobe,
  faClose,
  faBookmark,
  faBookBookmark
} from '@fortawesome/free-solid-svg-icons'
import { MatButtonModule } from '@angular/material/button'
import { MatMenuModule } from '@angular/material/menu'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { EditorService } from '../../services/editor.service'
import { LoginService } from '../../services/login.service'
import { CommonModule } from '@angular/common'
import { ReportService } from '../../services/report.service'
import { DeletePostService } from '../../services/delete-post.service'
import { PostsService } from '../../services/posts.service'
import { UtilsService } from '../../services/utils.service'
import { EnvironmentService } from '../../services/environment.service'
import { firstValueFrom } from 'rxjs'
import { faBluesky } from '@fortawesome/free-brands-svg-icons'
@Component({
  selector: 'app-post-actions',
  imports: [CommonModule, MatButtonModule, MatMenuModule, FontAwesomeModule],
  templateUrl: './post-actions.component.html',
  styleUrl: './post-actions.component.scss'
})
export class PostActionsComponent implements OnChanges {
  @Input() content!: ProcessedPost
  userLoggedIn = false
  myId: string = 'user-00000000-0000-0000-0000-000000000000 '
  postSilenced = false
  myRewootsIncludePost = false
  bookmarked = signal<boolean>(false)

  // icons
  shareIcon = faShareNodes
  expandDownIcon = faChevronDown
  solidHeartIcon = faHeart
  clearHeartIcon = faHeartBroken
  reblogIcon = faReply
  quickReblogIcon = faRepeat
  shareExternalIcon = faArrowUpRightFromSquare
  bskyIcon = faBluesky
  goExternalPost = faGlobe
  reportIcon = faTriangleExclamation
  deleteIcon = faTrash
  closeIcon = faClose
  editedIcon = faPen
  silenceIcon = faBellSlash
  unsilenceIcon = faBell
  quoteIcon = faQuoteLeft
  bookmarkIcon = faBookmark
  unbookmarkIcon = faBookBookmark

  constructor(
    private messages: MessageService,
    private editor: EditorService,
    private postService: PostsService,
    private loginService: LoginService,
    private reportService: ReportService,
    private deletePostService: DeletePostService,
    private utilsService: UtilsService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn()
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID()
    }
  }

  ngOnInit(): void {
    this.bookmarked.set(this.content.bookmarkers.includes(this.myId))
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.myRewootsIncludePost = this.postService.rewootedPosts.includes(this.content.id)
    this.checkPostSilenced()
  }

  sharePost() {
    navigator.clipboard.writeText(`${EnvironmentService.environment.frontUrl}/fediverse/post/${this.content.id}`)
    this.messages.add({
      severity: 'success',
      summary: 'The woot URL was copied to your clipboard!'
    })
  }

  shareOriginalPost() {
    let remoteId = this.content.remotePostId
    if (this.content.bskyUri) {
      console.log(this.content.bskyUri)
      const parts = this.content.bskyUri.split('/app.bsky.feed.post/')
      const userDid = parts[0].split('at://')[1]
      remoteId = `https://bsky.app/profile/${userDid}/post/${parts[1]}`
    }
    navigator.clipboard.writeText(remoteId)
    this.messages.add({
      severity: 'success',
      summary: 'The woot original URL was copied to your clipboard!'
    })
  }

  viewOriginalPost() {
    let remoteId = this.content.remotePostId
    if (this.content.bskyUri) {
      const parts = this.content.bskyUri.split('/app.bsky.feed.post/')
      const userDid = parts[0].split('at://')[1]
      remoteId = `https://bsky.app/profile/${userDid}/post/${parts[1]}`
    }
    window.open(remoteId, '_blank')
  }

  viewOnBsky() {
    if (this.content.bskyUri) {
      const parts = this.content.bskyUri.split('/app.bsky.feed.post/')
      const userDid = parts[0].split('at://')[1]
      window.open(`https://bsky.app/profile/${userDid}/post/${parts[1]}`, '_blank')
    }
  }

  async quickReblog() {
    if (this.content?.privacy !== 10) {
      const response = await this.editor.createPost({
        mentionedUsers: [],
        content: '',
        idPostToReblog: this.content.id,
        privacy: 0,
        media: []
      })
      if (response) {
        const enableConfetti = localStorage.getItem('enableConfetti') == 'true'
        this.myRewootsIncludePost = true
        this.messages.add({
          severity: 'success',
          summary: 'You rewooted the woot!',
          confettiEmojis: enableConfetti ? ['🔁'] : []
        })
      } else {
        this.messages.add({
          severity: 'error',
          summary: 'Something went wrong! Check your internet conectivity and try again'
        })
      }
    } else {
      this.messages.add({
        severity: 'warn',
        summary: 'Sorry, this woot is not rebloggeable as requested by the user'
      })
    }
  }

  replyPost() {
    this.editor.replyPost(this.content)
  }
  quoteWoot() {
    this.editor.quotePost(this.content)
  }
  async unlikePost() {
    if (await this.postService.unlikePost(this.content.id)) {
      this.content.userLikesPostRelations = this.content.userLikesPostRelations.filter((elem) => elem != this.myId)
      this.messages.add({
        severity: 'success',
        summary: 'You successfully unliked this woot'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
  }
  async likePost() {
    if (await this.postService.likePost(this.content.id)) {
      this.content.userLikesPostRelations.push(this.myId)
      const enableConfetti = localStorage.getItem('enableConfetti') == 'true'
      this.messages.add({
        severity: 'success',
        summary: 'You successfully liked this woot',
        confettiEmojis: enableConfetti ? ['❤️', '💚', '💙'] : []
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
  }
  async unbookmarkPost() {
    if (await this.postService.unbookmarkPost(this.content.id)) {
      this.content.bookmarkers = this.content.bookmarkers.filter((elem) => elem != this.myId)
      this.bookmarked.set(false)
      this.messages.add({
        severity: 'success',
        summary: 'You successfully unbookmarked this woot'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
  }
  async bookmarkPost() {
    if (await this.postService.bookmarkPost(this.content.id)) {
      this.content.bookmarkers.push(this.myId)
      const enableConfetti = localStorage.getItem('enableConfetti') == 'true'
      this.bookmarked.set(true)
      this.messages.add({
        severity: 'success',
        summary: 'You successfully bookmarked this woot',
        confettiEmojis: enableConfetti ? ['💾'] : []
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
  }
  reportPost() {
    this.reportService.openReportPostDialog(this.content)
  }
  editPost() {
    this.editor.replyPost(this.content, true)
  }
  deletePost() {
    this.deletePostService.openDeletePostDialog(this.content.id)
  }
  async silencePost(superMute: boolean = false) {
    if (await this.postService.silencePost(this.content.id, superMute)) {
      this.messages.add({
        severity: 'success',
        summary: 'You successfully silenced the notifications for this woot'
      })
      await this.checkPostSilenced()
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
  }

  async deleteRewoots() {
    const success = await firstValueFrom(this.deletePostService.deleteRewoots(this.content.id))
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
  }

  async unsilencePost() {
    if (await this.postService.unsilencePost(this.content.id)) {
      this.messages.add({
        severity: 'success',
        summary: 'You successfully reactivated the notifications for this woot'
      })
      await this.checkPostSilenced()
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again'
      })
    }
  }

  private async checkPostSilenced() {
    this.postSilenced = (await this.utilsService.getSilencedPostIds()).includes(this.content.id)
  }
}
