import { CommonModule } from '@angular/common'
import { Component, inject, model, OnDestroy, OnInit } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { faHome, faRepeat } from '@fortawesome/free-solid-svg-icons'
import { Subscription } from 'rxjs'
import { filter } from 'rxjs/operators'
import { LoaderComponent } from 'src/app/components/loader/loader.component'
import { PostFragmentComponent } from 'src/app/components/post-fragment/post-fragment.component'
import { PostModule } from 'src/app/components/post/post.module'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { DashboardService } from 'src/app/services/dashboard.service'
import { ForumService } from 'src/app/services/forum.service'
import { LoginService } from 'src/app/services/login.service'
import { PostsService } from 'src/app/services/posts.service'
import { PostHeaderComponent } from '../../components/post/post-header/post-header.component'

import { PostRibbonComponent } from 'src/app/components/post-ribbon/post-ribbon.component'
import { SnappyCreate } from 'src/app/components/snappy/snappy-life'
import { PostLinkModule } from 'src/app/directives/post-link/post-link.module'
import { EnvironmentService } from 'src/app/services/environment.service'
import { BottomReplyBarComponent } from '../../components/bottom-reply-bar/bottom-reply-bar.component'
import { BlogLinkModule } from 'src/app/directives/blog-link/blog-link.module'
import { snappyInject, SnappyRouter } from 'src/app/components/snappy/snappy-router.component'
import { SnappyPostData } from 'src/app/directives/post-link/post-link.directive'

@Component({
  selector: 'app-forum-component',
  imports: [
    CommonModule,
    RouterModule,
    PostFragmentComponent,
    LoaderComponent,
    MatCardModule,
    MatButtonModule,
    PostHeaderComponent,
    PostModule,
    FontAwesomeModule,
    MatPaginatorModule,
    BottomReplyBarComponent,
    PostRibbonComponent,
    PostLinkModule,
    BlogLinkModule
  ],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss'
})
export class ForumComponent implements OnInit, OnDestroy, SnappyCreate {
  loading = true
  forumPosts: ProcessedPost[] = []
  post = model<ProcessedPost[]>([]);
  postId = model<string>('');
  snappyPost = snappyInject(SnappyPostData);
  hasPost = false;
  subscription!: Subscription
  updateFollowsSubscription: Subscription
  navigationStart!: Subscription
  userLoggedIn = false
  myId = ''
  notYetAcceptedFollows: string[] = []
  followedUsers: string[] = []
  localUrl = EnvironmentService.environment.frontUrl

  // evil
  findReply = (id: string | undefined) => {
    return this.forumPosts.find((post) => post.id === id) ?? this.post().find((post) => post.id === id)
  }

  // local pagination
  currentPage = 0
  itemsPerPage = 50

  // icons
  rewootIcon = faRepeat
  private readonly route = inject(ActivatedRoute);
  homeIcon = faHome
  constructor(
    private forumService: ForumService,
    readonly loginService: LoginService,
    private postService: PostsService,
    private readonly dashboardService: DashboardService,
    private readonly router: Router,
    private readonly snappy: SnappyRouter
  ) {
    this.followedUsers = this.postService.followedUserIds
    this.notYetAcceptedFollows = this.postService.notYetAcceptedFollowedUsersIds
    this.updateFollowsSubscription = this.postService.updateFollowers.subscribe(() => {
      this.followedUsers = this.postService.followedUserIds
      this.notYetAcceptedFollows = this.postService.notYetAcceptedFollowedUsersIds
    })
    this.userLoggedIn = loginService.checkUserLoggedIn()
  }

  snOnCreate(): void {
    let data = this.snappyPost(this.snappy)?.post;
    if (!data) return;

    let post: ProcessedPost[] = [];
    for (const f of data.parentCollection) {
      post.push(f);
      if (f.id == data.id) {
        break;
      }
    }

    this.post.set(post);
    this.postId.set(data.id);
  }


  ngOnInit(): void {
    if (this.post().length > 0) {
      this.hasPost = true;
    }

    this.navigationStart = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
      });

    if (this.userLoggedIn) {
      this.myId = this.loginService.getLoggedUserUUID()
    }


    this.subscription = this.route.params.subscribe(async (data: any) => {
      this.loading = true
      if (this.hasPost && !this.postId()) this.postId.set(this.post()[0].id);
      if (data.id) {
        this.postId.set(data.id);
        const tmpTmpPost = this.dashboardService.getPostV2(this.postId())
        const tmpPost = await tmpTmpPost;
        this.post.set(tmpPost ?? []);
      } else if (data.blog && data.title) {
        // TODO article petition
      }
      const tmpForumPosts = this.forumService.getForumThread(this.postId());
      this.forumPosts = await tmpForumPosts;
      this.loading = false;
    })
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe()
    this.updateFollowsSubscription.unsubscribe()
  }

  followUser(id: string) { }

  unfollowUser(id: string) { }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'instant',
      block: 'start',
      inline: 'nearest'
    })
  }

  async loadRepliesFromFediverse() {
    this.loading = true;
    await this.postService.loadRepliesFromFediverse(this.post()[this.post().length - 1].id);
    this.forumPosts = await this.forumService.getForumThread(this.post()[this.post().length - 1].id);
    this.itemsPerPage = 50
    this.currentPage = 0
    this.loading = false
  }

  changePage(event: PageEvent) {
    this.scrollTo('scroll-here-on-page-change')
    this.itemsPerPage = event.pageSize
    this.currentPage = event.pageIndex
  }
}
