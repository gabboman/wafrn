import { Component, Input, OnInit } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { EditorService } from 'src/app/services/editor.service';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';
import { ReportService } from 'src/app/services/report.service';
import { environment } from 'src/environments/environment';
import { DeletePostService } from 'src/app/services/delete-post.service';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';
import { Action } from 'src/app/interfaces/editor-launcher-data';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit {

  @Input() post!: ProcessedPost[];
  @Input() showFull: boolean = false;
  originalPoster!: SimplifiedUser;
  originalPostContent: ProcessedPost[] = [];
  ready = false;
  sanitizedPostContent: string[] = [];

  mediaBaseUrl = environment.baseMediaUrl;
  cacheurl = environment.externalCacheurl;
  userLoggedIn = false;
  followedUsers: Array<String> = [];
  urls: string[] = [];
  avatars: string[] = [];
  notes: string = '---';
  quickReblogPanelVisible = false;
  quickReblogBeingDone = false;
  quickReblogDoneSuccessfully = false;
  reblogging = false;
  buttonItems: any = [];
  myId: string = '';
  loadingAction = false;
  // 0 no display at all 1 display like 2 display dislike
  showLikeFinalPost: number = 0;
  finalPost!: ProcessedPost;

  constructor(
    private postService: PostsService,
    private loginService: LoginService,
    private messages: MessageService,
    private editor: EditorService,
    private editorService: EditorService,
    private reportService: ReportService,
    private deletePostService: DeletePostService,
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();
    if(this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID();
    }
   }

  ngOnInit(): void {
    this.originalPoster = this.post[this.post.length - 1].user
    this.followedUsers = this.postService.followedUserIds;
    this.postService.updateFollowers.subscribe( () => {
      this.followedUsers = this.postService.followedUserIds;
    } );
    if(!this.showFull){
      this.originalPostContent = this.post;
      this.post = this.post.slice(0, environment.shortenPosts);

      if(this.originalPostContent.length === this.post.length) {
        this.showFull = true;
      }
    }

  }

  async ngOnChanges(): Promise<void> {
    this.sanitizedPostContent = this.post.map((elem) => this.postService.getPostHtml(elem.content));
    this.urls = this.post.map((elem) => elem.user.url);
    this.avatars = this.post.map((elem) => elem.user.url.startsWith('@') ? this.cacheurl + encodeURIComponent(elem.user.avatar) : this.mediaBaseUrl + elem.user.avatar)
    this.ready = true;
    this.updateButtonItems();
    let notes = this.post[this.post.length - 1].notes;
    this.notes = notes.toString();

    // if the last post is an EMPTY reblog we evaluate the like of the parent.
    const postToEvaluate = this.post[this.post.length - 1].content == '' && this.post[this.post.length - 1].tags.length == 0 && this.post.length > 1 ?
      this.post[this.post.length -2] : this.post[this.post.length -1]
    this.finalPost = postToEvaluate;

    this.showLikeFinalPost = postToEvaluate.userLikesPostRelations.includes(this.myId) ? 2 : 1

    if(postToEvaluate.userId === this.myId) {
      this.showLikeFinalPost = 0;
    }


  }

  async followUser(id: string) {
    let response = await this.postService.followUser(id);
    if(response) {
      this.messages.add({ severity: 'success', summary: 'You now follow this user!' });
    } else {
      this.messages.add({ severity: 'error', summary: 'Something went wrong! Check your internet conectivity and try again' });
    }
  }

  async unfollowUser(id: string) {
    let response = await this.postService.unfollowUser(id);
    if(response) {
      this.messages.add({ severity: 'success', summary: 'You no longer follow this user!' });
    } else {
      this.messages.add({ severity: 'error', summary: 'Something went wrong! Check your internet conectivity and try again' });
    }

  }

  launchReblog() {
    this.editorService.launchPostEditorEmitter.next({
      post: this.post[this.post.length - 1],
      action: Action.Response
    });
  }

  async quickReblog() {
    this.loadingAction = true;
      const response = await this.editor.createPost('', 0,  '',this.post[this.post.length - 1].id );
      if(response) {
        this.messages.add({ severity: 'success', summary: 'You reblogged the post succesfully' });
      } else {
        this.messages.add({ severity: 'error', summary: 'Something went wrong! Check your internet conectivity and try again' });
      }
    this.loadingAction = false;
  }

  sharePost(id: string) {
    navigator.clipboard.writeText(`${environment.frontUrl}/post/${id}`);
    this.messages.add({ severity: 'success', summary: 'The post URL was copied to your clipboard!' });

  }

  shareOriginalPost(url: string) {
    navigator.clipboard.writeText(url);
    this.messages.add({ severity: 'success', summary: 'The external url has been copied!' });

  }

  reportPost() {
    this.reportService.launchReportScreen.next(this.post);
  }

  deletePost(id: string) {
    this.deletePostService.launchDeleteScreen.next(id);
  }

  showQuickReblogOverlay() {
    this.quickReblogPanelVisible = true;
  }

  hideQuickReblogOverlay() {
    this.quickReblogPanelVisible = false;
  }

  updateButtonItems(){
    for (const content of this.post) {
      const buttonsForFragment: MenuItem[] = [
        {
          label: "Share with wafrn",
          title: "Copy the wafrn url of the post to the clipboard",
          icon: 'pi pi-share-alt',
          command: () => this.sharePost(content.id)
        },
        {
          label: "Share external url",
          title: "Copy the post external url",
          icon: 'pi pi-external-link',
          command: () => this.shareOriginalPost(content.remotePostId)
        },
      ];
      const loggedInButtons: MenuItem[] = [
        {
          label: "Reblog",
          title: "Open the reblog editor, reblogging this post",
          icon: 'pi pi-replay',
          command: () => this.editorService.launchPostEditorEmitter.next({
            action: Action.Response,
            post: content
          })
        },
        (content.content !== '' || content.tags.length != 0) && content.userId != this.myId  ?
        content.userLikesPostRelations.includes(this.myId) ?
        {
          label: "Remove like",
          title: "Remove your like to this post",
          icon: 'pi pi-heart-fill',
          command: () => this.unlikePost(content)
        }
        :
        {
          label: "Like this post",
          title: "Add a like to this post",
          icon: 'pi pi-heart',
          command: () => this.likePost(content)
        }
        : {
          label: 'NULL'
        },
        content.userId === this.myId ?
        {
          label: "Delete",
          title: "Open the delete panel for this post",
          icon: 'pi pi-trash',
          // TODO this is stupid this is ugly but I am sleepy and I shall not fix this now
          command: () => this.deletePostService.launchDeleteScreen.next(content.id)
        } :
        {
          label: "Report",
          title: "Open the report panel for this post",
          icon: 'pi pi-exclamation-triangle',
          // TODO this is stupid this is ugly but I am sleepy and I shall not fix this now
          command: () => this.reportService.launchReportScreen.next([content])
        }
      ].filter(elem => elem.label != 'NULL')
      this.buttonItems[content.id] = this.userLoggedIn ? buttonsForFragment.concat(loggedInButtons) :  buttonsForFragment;

    }

  }

  expandPost() {
    this.post = this.originalPostContent;
    this.showFull =true
  }

  dismissContentWarning() {
    this.post.forEach(elem => {
      elem.content_warning = '';
    })
    this.originalPostContent.forEach(elem => {
      elem.content_warning = ''
    })
  }


  async likePost( postToLike: ProcessedPost) {
    this.loadingAction = true;
    if(await this.postService.likePost(postToLike.id)) {
      postToLike.userLikesPostRelations.push(this.myId);
      this.ngOnChanges();
      this.messages.add({ severity: 'success', summary: 'You successfully liked this post' });
    } else {
      this.messages.add({ severity: 'error', summary: 'Something went wrong. Please try again' });

    }
    this.loadingAction = false;

  }

  async unlikePost(postToUnlike: ProcessedPost) {
    this.loadingAction = true;
    if(await this.postService.unlikePost(postToUnlike.id)) {
      postToUnlike.userLikesPostRelations =  postToUnlike.userLikesPostRelations.filter(elem => elem != this.myId)
      this.ngOnChanges();
      this.messages.add({ severity: 'success', summary: 'You no longer like this post' });
    } else {
      this.messages.add({ severity: 'error', summary: 'Something went wrong. Please try again' });
    }
    this.loadingAction = false;
  }

}

