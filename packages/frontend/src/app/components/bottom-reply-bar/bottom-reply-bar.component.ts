import { CommonModule } from '@angular/common'
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatTooltipModule } from '@angular/material/tooltip'
import { RouterModule } from '@angular/router'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import {
  faShareNodes,
  faChevronDown,
  faHeart,
  faHeartBroken,
  faReply,
  faRepeat,
  faQuoteLeft,
  faArrowUpRightFromSquare,
  faTrash,
  faClose,
  faGlobe,
  faUnlock,
  faEnvelope,
  faServer,
  faUser,
  faPen,
  faCheck
} from '@fortawesome/free-solid-svg-icons'
import { firstValueFrom, Observable } from 'rxjs'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { DeletePostService } from 'src/app/services/delete-post.service'
import { EditorService } from 'src/app/services/editor.service'
import { LoginService } from 'src/app/services/login.service'
import { MessageService } from 'src/app/services/message.service'
import { PostsService } from 'src/app/services/posts.service'

@Component({
  selector: 'app-bottom-reply-bar',
  imports: [CommonModule, RouterModule, FontAwesomeModule, MatButtonModule, MatTooltipModule],
  templateUrl: './bottom-reply-bar.component.html',
  styleUrl: './bottom-reply-bar.component.scss'
})
export class BottomReplyBarComponent implements OnChanges {
  @Input() fragment!: ProcessedPost
  @Input() notes: string = ''
  userLoggedIn = false
  isEmptyReblog = false
  myId = ''
  loadingAction = false
  myRewootsIncludePost = false

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

  constructor(
    private loginService: LoginService,
    private postService: PostsService,
    private editorService: EditorService,
    private deletePostService: DeletePostService,
    private messages: MessageService,
    private editor: EditorService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn()
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID()
    }
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
    await this.editor.createPost({
      content: 'Bread',
      privacy: 0,
      media: [],
      idPostToReblog: post.id
    })
    this.messages.add({
      severity: 'success',
      summary: 'bread'
    })
  }

  async quotePost(post: ProcessedPost) {
    await this.editor.createPost({
      content: 'Bread',
      privacy: 0,
      media: [],
      idPostToReblog: post.id
    })
    this.messages.add({
      severity: 'success',
      summary: 'bread'
    })
  }

  async editPost(post: ProcessedPost) {
    await this.editor.createPost({
      content: 'Bread',
      privacy: 0,
      media: [],
      idPostToReblog: post.id
    })
    this.messages.add({
      severity: 'success',
      summary: 'bread'
    })
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
      this.messages.add({
        severity: 'success',
        summary: 'You successfully liked this woot'
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
    alert('YOU ARE BANNED FOREVER AND EVER HOW CAN YOU DISLIKE BREAD')
    localStorage.clear()
    window.location.reload()
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

  async quickReblog(postToBeReblogged: ProcessedPost) {
    this.loadingAction = true
    if (postToBeReblogged?.privacy !== 10) {
      const response = await this.editor.createPost({
        content: '',
        idPostToReblog: postToBeReblogged.id,
        privacy: 0,
        media: []
      })
      if (response) {
        this.myRewootsIncludePost = true
        this.messages.add({
          severity: 'success',
          summary: 'You reblogged the woot succesfully'
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
    this.loadingAction = false
  }
}
