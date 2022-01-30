import { Component, Input, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { EditorService } from 'src/app/services/editor.service';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';
import { ReportService } from 'src/app/services/report.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit {

  @Input() post!: ProcessedPost[];
  ready = false;
  sanitizedPostContent: string[] = [];

  mediaBaseUrl = environment.baseMediaUrl;
  userLoggedIn = false;
  followedUsers: Array<String> = [];
  urls: string[] = [];
  notes: string = '---';
  quickReblogPanelVisible = false;
  quickReblogBeingDone = false;
  quickReblogDoneSuccessfully = false;
  captchaKey = environment.recaptchaPublic;
  captchaResponse: string | undefined;





  constructor(
    private postService: PostsService,
    private loginService: LoginService,
    private messages: MessageService,
    private editor: EditorService,
    private editorService: EditorService,
    private reportService: ReportService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();
   }

  async ngOnInit(): Promise<void> {
    this.followedUsers = this.postService.followedUserIds;
    this.postService.updateFollowers.subscribe( () => {
      this.followedUsers = this.postService.followedUserIds;
    } );
    this.sanitizedPostContent = this.post.map((elem) => this.postService.getPostHtml(elem.content));
    this.urls = this.post.map((elem) => encodeURIComponent(elem.user.url));
    this.ready = true;
    let notes = await this.postService.getDetails(this.post[0].id);
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
    this.editorService.launchPostEditorEmitter.next(this.post[this.post.length - 1].id);
  }

  async quickReblog() {

    if(this.captchaResponse) {
      let response = await this.editor.createPost('', this.captchaResponse, '', this.post[this.post.length - 1].id );
      if(response) {
        this.messages.add({ severity: 'success', summary: 'You reblogged the post succesfully' });
      } else {
        this.messages.add({ severity: 'error', summary: 'Something went wrong! Check your internet conectivity and try again' });
      }
    }
  }

  sharePost() {
    navigator.clipboard.writeText(environment.frontUrl + '/post/' + encodeURIComponent(this.post[this.post.length - 1].id) );
    this.messages.add({ severity: 'success', summary: 'The post URL was copied to your clipboard!' });

  }

  reportPost() {
    this.reportService.launchReportScreen.next(this.post);
  }

  showQuickReblogOverlay() {
    this.quickReblogPanelVisible = true;
  }

  hideQuickReblogOverlay() {
    this.quickReblogPanelVisible = false;
  }

  captchaResolved(event: any) {
    this.captchaResponse = event.response;

  }

  captchaExpired() {
    this.captchaResponse = undefined;
  }


}

