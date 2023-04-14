import { Component, Input, OnInit } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { EditorService } from 'src/app/services/editor.service';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';
import { ReportService } from 'src/app/services/report.service';
import { environment } from 'src/environments/environment';
import { ReCaptchaV3Service } from 'ng-recaptcha';
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
  captchaKey = environment.recaptchaPublic;
  captchaResponse: string | undefined;
  reblogging = false;
  buttonItems: any = [];
  myId: string = '';





  constructor(
    private postService: PostsService,
    private loginService: LoginService,
    private messages: MessageService,
    private editor: EditorService,
    private editorService: EditorService,
    private reportService: ReportService,
    private recaptchaV3Service: ReCaptchaV3Service,
    private deletePostService: DeletePostService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();
    if(this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID();
    }
   }

  async ngOnInit(): Promise<void> {
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
    this.reblogging = true;
    this.captchaResponse = await this.recaptchaV3Service.execute('quick_reblog').toPromise();
    if(this.captchaResponse) {
      let response = await this.editor.createPost('', this.captchaResponse, 0,  '',this.post[this.post.length - 1].id );
      if(response) {
        this.messages.add({ severity: 'success', summary: 'You reblogged the post succesfully' });
      } else {
        this.messages.add({ severity: 'error', summary: 'Something went wrong! Check your internet conectivity and try again' });
      }
    }
    this.reblogging = false;
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
      const loggedInButtons = [
        {
          label: "Reblog",
          title: "Open the reblog editor, reblogging this post",
          icon: 'pi pi-replay',
          command: () => this.editorService.launchPostEditorEmitter.next({
            action: Action.Response,
            post: content
          })
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
      ]
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

}

