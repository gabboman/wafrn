import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { EditorService } from 'src/app/services/editor.service';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';
import { ReportService } from 'src/app/services/report.service';
import { environment } from 'src/environments/environment';
import { DeletePostService } from 'src/app/services/delete-post.service';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';
import { Action } from 'src/app/interfaces/editor-launcher-data';
import { MessageService } from 'src/app/services/message.service';
import {
  faArrowUpRightFromSquare,
  faChevronDown,
  faClockRotateLeft,
  faHeart,
  faHeartBroken,
  faRotateLeft,
  faShareNodes,
  faTrash,
  faTriangleExclamation,
  faGlobe,
  faEnvelope,
  faServer,
  faUser,
  faUnlock,
  faPen,
} from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
})
export class PostComponent implements OnInit {
  @Input() post!: ProcessedPost[];
  @Input() showFull: boolean = false;
  originalPoster!: SimplifiedUser;
  originalPostContent: ProcessedPost[] = [];
  ready = false;
  mediaBaseUrl = environment.baseMediaUrl;
  cacheurl = environment.externalCacheurl;
  userLoggedIn = false;
  followedUsers: string[] = [];
  notYetAcceptedFollows: string[] = [];
  avatars: string[] = [];
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

  // icons
  shareIcon = faShareNodes;
  expandDownIcon = faChevronDown;
  solidHeartIcon = faHeart;
  clearHeartIcon = faHeartBroken;
  reblogIcon = faRotateLeft;
  quickReblogIcon = faClockRotateLeft;
  shareExternalIcon = faArrowUpRightFromSquare;
  reportIcon = faTriangleExclamation;
  deleteIcon = faTrash;
  worldIcon = faGlobe;
  unlockIcon = faUnlock;
  envelopeIcon = faEnvelope;
  serverIcon = faServer;
  userIcon = faUser;
  editedIcon = faPen;

  // post seen
  @Output() seenEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private postService: PostsService,
    private loginService: LoginService,
    private messages: MessageService,
    private editor: EditorService,
    private editorService: EditorService,
    private reportService: ReportService,
    private deletePostService: DeletePostService,
    private dialogService: MatDialog
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID();
    }
  }

  ngOnInit(): void {
    this.originalPoster = this.post[this.post.length - 1].user;
    this.followedUsers = this.postService.followedUserIds;
    this.notYetAcceptedFollows =
      this.postService.notYetAcceptedFollowedUsersIds;
    this.postService.updateFollowers.subscribe(() => {
      this.followedUsers = this.postService.followedUserIds;
      this.notYetAcceptedFollows =
        this.postService.notYetAcceptedFollowedUsersIds;
    });
    if (!this.showFull) {
      this.originalPostContent = this.post;
      this.post = this.post.slice(0, environment.shortenPosts);

      if (this.originalPostContent.length === this.post.length) {
        this.showFull = true;
      }
    }
  }

  async ngOnChanges(): Promise<void> {
    this.avatars = this.post.map((elem) =>
      elem.user.url.startsWith('@')
        ? this.cacheurl + encodeURIComponent(elem.user.avatar)
        : this.mediaBaseUrl + elem.user.avatar
    );
    this.ready = true;
    const notes = this.post[this.post.length - 1].notes;
    this.notes = notes.toString();

    // if the last post is an EMPTY reblog we evaluate the like of the parent.
    const postToEvaluate =
      this.post[this.post.length - 1].content == '' &&
      this.post[this.post.length - 1].tags.length == 0 &&
      this.post.length > 1
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
    if (postToBeReblogged?.privacy === 0) {
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

  sharePost(id: string) {
    navigator.clipboard.writeText(`${environment.frontUrl}/post/${id}`);
    this.messages.add({
      severity: 'success',
      summary: 'The woot URL was copied to your clipboard!',
    });
  }

  shareOriginalPost(url: string) {
    navigator.clipboard.writeText(url);
    this.messages.add({
      severity: 'success',
      summary: 'The external url has been copied!',
    });
  }

  async replyPost(post: ProcessedPost) {
    this.dialogService.open(await this.editorService.getEditorComponent(), {
      data: { post },
      width: '100%',
    });
  }

  async reportPost(post: ProcessedPost) {
    this.dialogService.open(await this.reportService.getReportComponent(), {
      data: { post },
      width: '100%',
    });
  }

  async editPost(post: ProcessedPost) {
    this.dialogService.open(await this.editorService.getEditorComponent(), {
      data: { post, edit: true },
      width: '100%',
    });
  }

  async deletePost(id: string) {
    this.dialogService.open(
      await this.deletePostService.getDeletePostComponent(),
      {
        data: { id },
        width: '100%',
      }
    );
  }

  expandPost() {
    this.post = this.originalPostContent;
    this.showFull = true;
  }

  dismissContentWarning() {
    this.post.forEach((elem) => {
      elem.content_warning = '';
    });
    this.originalPostContent.forEach((elem) => {
      elem.content_warning = '';
    });
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
