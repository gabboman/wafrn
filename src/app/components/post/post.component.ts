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
import { environment } from 'src/environments/environment';
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
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
})
export class PostComponent implements OnInit, OnChanges, OnDestroy {
  @Input() post!: ProcessedPost[];
  @Input() showFull: boolean = false;
  originalPostContent: ProcessedPost[] = [];
  ready = false;
  mediaBaseUrl = environment.baseMediaUrl;
  cacheurl = environment.externalCacheurl;
  userLoggedIn = false;
  followedUsers: string[] = [];
  notYetAcceptedFollows: string[] = [];
  notes: string = '---';
  quickReblogPanelVisible = false;
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
  shareExternalIcon = faArrowUpRightFromSquare;
  deleteIcon = faTrash;
  closeIcon = faClose;
  worldIcon = faGlobe;
  unlockIcon = faUnlock;
  envelopeIcon = faEnvelope;
  serverIcon = faServer;
  userIcon = faUser;
  editedIcon = faPen;

  // subscriptions
  updateFollowersSubscription;

  // post seen
  @Output() seenEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  // dismiss cw
  showCw = true;

  constructor(
    private postService: PostsService,
    private loginService: LoginService,
    private messages: MessageService,
    private editor: EditorService,
    private editorService: EditorService,
    private deletePostService: DeletePostService
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
  }
  ngOnDestroy(): void {
    this.updateFollowersSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.followedUsers = this.postService.followedUserIds;
    this.notYetAcceptedFollows =
      this.postService.notYetAcceptedFollowedUsersIds;
    this.originalPostContent = this.post;
    if (!this.showFull) {
      this.post = this.post.slice(0, environment.shortenPosts);

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
    return (
      this.post &&
      this.post[this.post.length - 1].content == '' &&
      this.post[this.post.length - 1].tags.length == 0
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

    this.showLikeFinalPost = postToEvaluate.userLikesPostRelations.includes(
      this.myId
    )
      ? 2
      : 1;

    if (postToEvaluate.userId === this.myId) {
      this.showLikeFinalPost = 0;
    }
  }

  async followUser(id: string) {
    const response = await this.postService.followUser(id);
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: 'You now follow this user!',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary:
          'Something went wrong! Check your internet conectivity and try again',
      });
    }
  }

  async unfollowUser(id: string) {
    const response = await this.postService.unfollowUser(id);
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: 'You no longer follow this user!',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary:
          'Something went wrong! Check your internet conectivity and try again',
      });
    }
  }

  launchReblog() {
    this.editorService.launchPostEditorEmitter.next({
      post: this.finalPost,
      action: Action.Response,
    });
  }

  async quickReblog(postToBeReblogged: ProcessedPost) {
    this.loadingAction = true;
    if (postToBeReblogged?.privacy !== 10) {
      const response = await this.editor.createPost({
        content: '',
        idPostToReblog: postToBeReblogged.id,
        privacy: 0,
        media: [],
      });
      if (response) {
        this.messages.add({
          severity: 'success',
          summary: 'You reblogged the woot succesfully',
        });
      } else {
        this.messages.add({
          severity: 'error',
          summary:
            'Something went wrong! Check your internet conectivity and try again',
        });
      }
    } else {
      this.messages.add({
        severity: 'warn',
        summary:
          'Sorry, this woot is not rebloggeable as requested by the user',
      });
    }
    this.loadingAction = false;
  }

  shareOriginalPost(url: string) {
    navigator.clipboard.writeText(url);
    this.messages.add({
      severity: 'success',
      summary: 'The external url has been copied!',
    });
  }

  async replyPost(post: ProcessedPost) {
    await this.editorService.replyPost(post);
  }

  async editPost(post: ProcessedPost) {
    await this.editorService.replyPost(post, true);
  }

  async deletePost(id: string) {
    this.deletePostService.openDeletePostDialog(id);
  }

  expandPost() {
    this.post = this.originalPostContent;
    this.veryLongPost = false;
    this.showFull = true;
  }

  dismissContentWarning() {
    this.showCw = false;
  }

  async likePost(postToLike: ProcessedPost) {
    this.loadingAction = true;
    if (await this.postService.likePost(postToLike.id)) {
      postToLike.userLikesPostRelations.push(this.myId);
      this.ngOnChanges();
      this.messages.add({
        severity: 'success',
        summary: 'You successfully liked this woot',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again',
      });
    }
    this.loadingAction = false;
  }

  async unlikePost(postToUnlike: ProcessedPost) {
    this.loadingAction = true;
    if (await this.postService.unlikePost(postToUnlike.id)) {
      postToUnlike.userLikesPostRelations =
        postToUnlike.userLikesPostRelations.filter((elem) => elem != this.myId);
      this.ngOnChanges();
      this.messages.add({
        severity: 'success',
        summary: 'You no longer like this woot',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again',
      });
    }
    this.loadingAction = false;
  }
}
