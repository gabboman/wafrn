import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-view-blog',
  templateUrl: './view-blog.component.html',
  styleUrls: ['./view-blog.component.scss']
})
export class ViewBlogComponent implements OnInit {
  //TODO try to put the logic of search, viewblog, dashboard, explore in the same thingy
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



  constructor(
    private activatedRoute: ActivatedRoute,
    private dashboardService: DashboardService,
    private postService: PostsService,
    private messages: MessageService,
    private loginService: LoginService,
    private router: Router,
    private titleService: Title,
    private metaTagService: Meta
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();
    // override the route reuse strategy
    this.router.routeReuseStrategy.shouldReuseRoute = function() {
      return false;
  };

  }

  ngOnInit(): void {
    this.followedUsers = this.postService.followedUserIds;
    this.postService.updateFollowers.subscribe( () => {
      this.followedUsers = this.postService.followedUserIds;
    } );
    let blogUrl = this.activatedRoute.snapshot.paramMap.get('url');
    if(blogUrl) {
      this.blogUrl = blogUrl;
    }
    this.dashboardService.getBlogDetails(this.blogUrl).then(blogResponse => {
      if(blogResponse.success === false){
        this.found = false;
      } else {
        this.blogDetails = blogResponse;
      this.loadPosts(this.currentPage).then(() => this.loading = false);
      this.avatarUrl = this.blogDetails.url.startsWith('@') ? environment.externalCacheurl + encodeURIComponent(this.blogDetails.avatar) : environment.baseMediaUrl + this.blogDetails.avatar
      this.titleService.setTitle(`${this.blogDetails.url}\'s blog`);
        this.metaTagService.addTags([
          {name: 'description', content: `${this.blogDetails.url}\'s wafrn blog`},
          {name: 'author', content: this.blogDetails.url },
          {name: 'image', content: this.avatarUrl}
        ]);
      }
    })

  }

  async countViewedPost() {
    this.viewedPosts++;
    if (this.posts.length - 3 < this.viewedPosts) {
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

}
