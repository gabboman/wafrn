import { ChangeDetectorRef, Component, Injector, Input, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';
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


  constructor(
    private postService: PostsService,
    private cdr: ChangeDetectorRef,
    private loginService: LoginService,
    private messages: MessageService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();
   }

  ngOnInit(): void {
    this.followedUsers = this.postService.followedUserIds;
    this.postService.updateFollowers.subscribe( () => {
      this.followedUsers = this.postService.followedUserIds;
    } );
    this.sanitizedPostContent = this.post.map((elem) => this.postService.getPostHtml(elem.content));
    this.ready = true;
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





}

