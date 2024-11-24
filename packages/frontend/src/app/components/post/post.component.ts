import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { EditorService } from 'src/app/services/editor.service';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';

import { DeletePostService } from 'src/app/services/delete-post.service';
import { Action } from 'src/app/interfaces/editor-launcher-data';
import { MessageService } from 'src/app/services/message.service';
import {
  faArrowUpRightFromSquare,
  faChevronDown,
  faHeart,
  faHeartBroken,
  faShareNodes,
  faTrash,
  faGlobe,
  faEnvelope,
  faServer,
  faUser,
  faUnlock,
  faPen,
  faClose,
  faReply,
  faRepeat,
  faQuoteLeft,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { EnvironmentService } from 'src/app/services/environment.service';

@Component({
    selector: 'app-post',
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.scss'],
    standalone: false
})
export class PostComponent implements OnInit, OnChanges, OnDestroy {
  @Input() post!: ProcessedPost[];
  @Input() showFull: boolean = false;
  originalPostContent: ProcessedPost[] = [];
  ready = false;
  mediaBaseUrl = EnvironmentService.environment.baseMediaUrl;
  cacheurl = EnvironmentService.environment.externalCacheurl;
  userLoggedIn = false;
  followedUsers: string[] = [];
  notYetAcceptedFollows: string[] = [];
  notes: string = '---';
  headerText: string = '';
  quickReblogBeingDone = false;
  quickReblogDoneSuccessfully = false;
  reblogging = false;
  myId: string = '';
  loadingAction = false;
  // 0 no display at all 1 display like 2 display dislike
  showLikeFinalPost: number = 0;
  finalPost!: ProcessedPost;

  veryLongPost = false;

  // icons
  shareIcon = faShareNodes;
  expandDownIcon = faChevronDown;
  solidHeartIcon = faHeart;
  clearHeartIcon = faHeartBroken;
  reblogIcon = faReply;
  quickReblogIcon = faRepeat;
  quoteIcon = faQuoteLeft;
  shareExternalIcon = faArrowUpRightFromSquare;
  deleteIcon = faTrash;
  closeIcon = faClose;
  worldIcon = faGlobe;
  unlockIcon = faUnlock;
  envelopeIcon = faEnvelope;
  serverIcon = faServer;
  userIcon = faUser;
  editedIcon = faPen;
  checkIcon = faCheck;

  // subscriptions
  updateFollowersSubscription;
  updateLikesSubscription;

  // post seen
  @Output() seenEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  // dismiss cw
  showCw = true;

  constructor(
    public postService: PostsService,
    private loginService: LoginService,
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID();
    }
    this.updateFollowersSubscription = this.postService.updateFollowers.subscribe(() => {
      this.followedUsers = this.postService.followedUserIds;
      this.notYetAcceptedFollows =
        this.postService.notYetAcceptedFollowedUsersIds;
    });

    this.updateLikesSubscription = this.postService.postLiked.subscribe(likeEvent => {
      if (this.post && likeEvent.id === this.post[this.post.length - 1].id) {
        if (likeEvent.like) {
          this.originalPostContent[this.originalPostContent.length - 1].userLikesPostRelations = [this.loginService.getLoggedUserUUID()]
        } else {
          this.originalPostContent[this.originalPostContent.length - 1].userLikesPostRelations = []
        }
      }
    })
  }
  ngOnDestroy(): void {
    this.updateFollowersSubscription.unsubscribe();
    this.updateLikesSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.followedUsers = this.postService.followedUserIds;
    this.notYetAcceptedFollows =
      this.postService.notYetAcceptedFollowedUsersIds;
    this.originalPostContent = this.post;
    if (!this.showFull) {
      this.post = this.post.slice(0, EnvironmentService.environment.shortenPosts);

      if (this.originalPostContent.length === this.post.length) {
        this.showFull = true;
      }

    }
    setTimeout(() => {
      const postHtmlId = 'post-element-' + this.finalPost.id;
      const postHtmlElement = document.getElementById(postHtmlId);
      if (postHtmlElement) {
        const postHeight = postHtmlElement.getBoundingClientRect().height;
        this.veryLongPost = postHeight > 1250;
        this.showFull = this.showFull || this.veryLongPost;
      }
    }, 150);
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
    );
  }

  ngOnChanges() {
    this.ready = true;
    const notes = this.post[this.post.length - 1].notes;
    this.notes = notes.toString();

    // if the last post is an EMPTY reblog we evaluate the like of the parent.
    const postToEvaluate =
      this.isEmptyReblog() && this.post.length > 1
        ? this.post[this.post.length - 2]
        : this.post[this.post.length - 1];
    this.finalPost = postToEvaluate;
    this.headerText = this.isEmptyReblog() ? "rewooted" : "replied"

    this.showLikeFinalPost = postToEvaluate.userLikesPostRelations.includes(
      this.myId
    )
      ? 2
      : 1;

    if (postToEvaluate.userId === this.myId) {
      this.showLikeFinalPost = 0;
    }
  }



  expandPost() {
    this.post = this.originalPostContent;
    this.veryLongPost = false;
    this.showFull = true;
  }

  dismissContentWarning() {
    this.showCw = !this.showCw;
  }
}
