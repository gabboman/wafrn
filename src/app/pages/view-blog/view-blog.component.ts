import { Component, OnDestroy, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { Subscription, filter } from 'rxjs';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { BlocksService } from 'src/app/services/blocks.service';
import { DashboardService } from 'src/app/services/dashboard.service';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';
import { ThemeService } from 'src/app/services/theme.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-view-blog',
  templateUrl: './view-blog.component.html',
  styleUrls: ['./view-blog.component.scss']
})
export class ViewBlogComponent implements OnInit, OnDestroy {
  loading = true;
  found = true;
  viewedPosts = 0;
  currentPage = 0;
  posts: ProcessedPost[][] = [];
  blogUrl: string = '';
  blogDetails: any;
  followedUsers: Array<String> = [];
  userLoggedIn = false;
  avatarUrl = '';
  navigationSubscription!: Subscription;
  showModalTheme = false;

  splitButtonItems: MenuItem[] = [];


  constructor(
    private activatedRoute: ActivatedRoute,
    private dashboardService: DashboardService,
    private postService: PostsService,
    private messages: MessageService,
    private loginService: LoginService,
    private router: Router,
    private titleService: Title,
    private metaTagService: Meta,
    private themeService: ThemeService,
    private blockService: BlocksService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();
  }
  ngOnDestroy(): void {
    if(this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.navigationSubscription = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((ev)=> {
      this.loading = true;
      this.found = true;
      this.viewedPosts = 0;
      this.currentPage = 0;
      this.posts = [];
      this.blogUrl = '';
      this.avatarUrl = '';
      this.ngOnInit()
    })
    this.followedUsers = this.postService.followedUserIds;
    this.postService.updateFollowers.subscribe( () => {
      this.followedUsers = this.postService.followedUserIds;
    } );
    const blogUrl = this.activatedRoute.snapshot.paramMap.get('url');
    if(blogUrl) {
      this.blogUrl = blogUrl;
    }
    this.dashboardService.getBlogDetails(this.blogUrl).then(blogResponse => {
      if(blogResponse.success === false){
        this.found = false;
      } else {
      this.blogDetails = blogResponse;
      this.splitButtonItems = [

        blogResponse.muted ?
        {
          disabled: true,
          title: 'You muted this user',
          label: 'You muted this user',
          icon: 'pi pi-volume-off',
        } : {
          title: 'Mute user',
          label: 'Mute user',
          command: () => this.blockService.muteUser(this.blogDetails.id).then(() => this.ngOnInit()),
          icon: 'pi pi-volume-off',
        },
        blogResponse.blocked ?
        {
          disabled: true,
          title: 'You blocked this user',
          label: 'You blocked this user',
          icon: 'pi pi-ban',

        } : {
          title: 'Block user',
          label: 'Block user',
          command: () => this.blockService.blockUser(this.blogDetails.id).then(() => this.ngOnInit()),
          icon: 'pi pi-ban',

        },
        blogResponse.url.startsWith('@') && !blogResponse.serverBlocked ?
        {
          title: 'Block server',
          label: 'Block server',
          icon: 'pi pi-server',
          command: () => this.blockService.blockServer(this.blogDetails.id).then(() => this.ngOnInit())
        } : {
          disabled: true,
          visible: blogResponse.url.startsWith('@'),
          title: `You have blocked this user's server`,
          label: `You have blocked this user's server`,
          icon: 'pi pi-server'

        } ,
      ]
      this.loadPosts(this.currentPage).then(() => {
        this.loading = false;
      });
      this.avatarUrl = this.blogDetails.url.startsWith('@') ? environment.externalCacheurl + encodeURIComponent(this.blogDetails.avatar) : environment.baseMediaUrl + this.blogDetails.avatar
      this.titleService.setTitle(`${this.blogDetails.url}\'s blog`);
        this.metaTagService.addTags([
          {name: 'description', content: `${this.blogDetails.url}\'s wafrn blog`},
          {name: 'author', content: this.blogDetails.url },
          {name: 'image', content: this.avatarUrl}
        ]);
      }
      this.themeService.checkThemeExists(this.blogDetails.id).then((userHasCustomTheme) => {
        if(userHasCustomTheme){
          const userResponseToCustomThemes = this.themeService.hasUserAcceptedCustomThemes();
          if ( userResponseToCustomThemes === 2) {
            this.themeService.setTheme(this.blogDetails.id)
          }

          if (userResponseToCustomThemes === 0) {
            this.showModalTheme = true;
          }
        } else {
          this.themeService.setTheme('');
        }
      })
    })



  }

  async countViewedPost() {
    this.viewedPosts++;
    if (this.posts.length === this.viewedPosts) {
      this.currentPage++;
      await this.loadPosts(this.currentPage);
    }
  }

  async loadPosts(page: number) {
    let tmpPosts = await this.dashboardService.getBlogPage(page, this.blogUrl);
    tmpPosts.forEach(post => {
      this.posts.push(post);
    });
  }

  async unfollowUser(id: string) {
    let response = await this.postService.unfollowUser(id);
    if(response) {
      this.messages.add({ severity: 'success', summary: 'You no longer follow this user!' });
    } else {
      this.messages.add({ severity: 'error', summary: 'Something went wrong! Check your internet conectivity and try again' });
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


  answerCustomThemeModal(response: number) {
    localStorage.setItem('acceptsCustomThemes', response.toString());
    if (response === 2) {
      this.themeService.setTheme(this.blogDetails.id)
    }
    this.showModalTheme = false;
  }

}
