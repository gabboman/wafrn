import { Component, computed, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, signal } from '@angular/core'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { LoginService } from 'src/app/services/login.service'
import { PostsService } from 'src/app/services/posts.service'

import {
  faArrowUpRightFromSquare,
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
import { SimplifiedUser } from 'src/app/interfaces/simplified-user'
import { EnvironmentService } from 'src/app/services/environment.service'
import { SnappyService } from 'src/app/services/snappy.service'

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  standalone: false
})
export class PostComponent implements OnInit, OnDestroy, OnChanges {
  @Input() post!: ProcessedPost[];
  showFull: boolean = false
  postCanExpand = computed(() => {
    let textLength = 0
    if (this.originalPostContent) {
      textLength = this.originalPostContent.map((elem) => elem.content).join('').length
      this.originalPostContent.map((block) => block.content).join('').length
    }
    return (
      ((textLength > 2500 || !this.showFull) && !this.expanded()) ||
      !(this.post.length === this.originalPostContent.length)
    )
  })
  postsExpanded = EnvironmentService.environment.shortenPosts
  expanded = signal(false)
  originalPostContent: ProcessedPost[] = []
  finalPosts: ProcessedPost[] = []
  ready = false
  mediaBaseUrl = EnvironmentService.environment.baseMediaUrl
  cacheurl = EnvironmentService.environment.externalCacheurl
  userLoggedIn = false
  followedUsers: string[] = []
  notYetAcceptedFollows: string[] = []
  notes: string = '---'
  headerText: string = ''
  quickReblogBeingDone = false
  quickReblogDoneSuccessfully = false
  reblogging = false
  myId: string = ''
  loadingAction = false
  // 0 no display at all 1 display like 2 display dislike
  showLikeFinalPost: number = 0
  finalPost!: ProcessedPost
  anchorBase: string = '';

  // icons
  shareIcon = faShareNodes
  expandDownIcon = faChevronDown
  solidHeartIcon = faHeart
  clearHeartIcon = faHeartBroken
  replyIcon = faReply
  reblogIcon = faRepeat
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

  // subscriptions
  updateFollowersSubscription
  updateLikesSubscription

  // post seen
  @Output() seenEmitter: EventEmitter<boolean> = new EventEmitter<boolean>()

  // dismiss cw
  showCw = true

  // VARIABLES FOR TEMPLATE RENDERING
  ribbonUser: SimplifiedUser | undefined
  ribbonIcon = this.replyIcon
  ribbonTime = new Date(0)

  constructor(
    public postService: PostsService,
    private readonly loginService: LoginService,
    public scrollService: SnappyService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn()
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID()
    }
    this.updateFollowersSubscription = this.postService.updateFollowers.subscribe(() => {
      this.followedUsers = this.postService.followedUserIds
      this.notYetAcceptedFollows = this.postService.notYetAcceptedFollowedUsersIds
    })

    this.updateLikesSubscription = this.postService.postLiked.subscribe((likeEvent) => {
      if (this.post && likeEvent.id === this.post[this.post.length - 1].id) {
        if (likeEvent.like) {
          this.originalPostContent[this.originalPostContent.length - 1].userLikesPostRelations = [
            this.loginService.getLoggedUserUUID()
          ]
        } else {
          this.originalPostContent[this.originalPostContent.length - 1].userLikesPostRelations = []
        }
      }
    })
  }

  ngOnDestroy(): void {
    this.updateFollowersSubscription.unsubscribe()
    this.updateLikesSubscription.unsubscribe()
  }

  ngOnInit(): void {
    this.followedUsers = this.postService.followedUserIds
    this.notYetAcceptedFollows = this.postService.notYetAcceptedFollowedUsersIds
    this.originalPostContent = this.post
    this.finalPosts = this.originalPostContent.slice(-5)
    if (!this.showFull) {
      this.post = this.post.slice(0, EnvironmentService.environment.shortenPosts)

      if (this.originalPostContent.length === this.post.length) {
        this.showFull = true
      }
    }
    this.ribbonUser = this.originalPostContent[this.originalPostContent.length - 1].user
    this.ribbonIcon = this.headerText === 'replied' ? this.replyIcon : this.reblogIcon
    this.ribbonTime = this.originalPostContent[this.originalPostContent.length - 1].createdAt
    // If user has marked autoexpand we force 1 expand. Doing full could cause EXPLOSIONS
    if (localStorage.getItem('automaticalyExpandPosts') === 'true') {
      this.expandPost()
    }
  }

  isEmptyReblog() {
    const finalOne = this.post[this.post.length - 1]
    return (
      this.post &&
      finalOne.content == '' &&
      finalOne.tags.length == 0 &&
      finalOne.quotes.length == 0 &&
      !finalOne.questionPoll &&
      finalOne.medias?.length == 0
    )
  }

  ngOnChanges() {
    this.ready = true
    const notes = this.post[this.post.length - 1].notes
    this.notes = notes.toString()

    // if the last post is an EMPTY reblog we evaluate the like of the parent.
    const postToEvaluate =
      this.isEmptyReblog() && this.post.length > 1 ? this.post[this.post.length - 2] : this.post[this.post.length - 1]
    this.finalPost = postToEvaluate
    this.headerText = this.isEmptyReblog() ? 'rewooted' : 'replied'

    this.showLikeFinalPost = postToEvaluate.userLikesPostRelations.includes(this.myId) ? 2 : 1

    if (postToEvaluate.userId === this.myId) {
      this.showLikeFinalPost = 0
    }
  }

  expandPost() {
    this.expanded.set(true)
    this.postsExpanded = this.postsExpanded + 100
    this.post = this.originalPostContent.slice(0, this.postsExpanded)
  }
}
