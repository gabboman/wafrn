import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { ActivatedRoute, Router, RouterModule, NavigationEnd } from '@angular/router'
import { Subscription } from 'rxjs'
import { LoaderComponent } from 'src/app/components/loader/loader.component'
import { PostFragmentComponent } from 'src/app/components/post-fragment/post-fragment.component'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { ForumService } from 'src/app/services/forum.service'
import { LoginService } from 'src/app/services/login.service'
import { PostsService } from 'src/app/services/posts.service'
import { PostHeaderComponent } from '../../components/post/post-header/post-header.component'
import { PostModule } from 'src/app/components/post/post.module'
import { DashboardService } from 'src/app/services/dashboard.service'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { faHome, faRepeat } from '@fortawesome/free-solid-svg-icons'
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'
import { filter } from 'rxjs/operators';

import { BottomReplyBarComponent } from '../../components/bottom-reply-bar/bottom-reply-bar.component'
import { EnvironmentService } from 'src/app/services/environment.service'
import { PostRibbonComponent } from 'src/app/components/post-ribbon/post-ribbon.component'
import { ScrollContext, ScrollService } from 'src/app/services/scroll.service'

@Component({
  selector: 'app-forum',
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
    PostRibbonComponent
  ],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss'
})
export class ForumComponent implements OnInit, OnDestroy {
  loading = true
  forumPosts: ProcessedPost[] = []
  post: ProcessedPost[] = []
  subscription: Subscription
  updateFollowsSubscription: Subscription
  navigationStart!: Subscription
  userLoggedIn = false
  myId = ''
  notYetAcceptedFollows: string[] = []
  followedUsers: string[] = []
  localUrl = EnvironmentService.environment.frontUrl

  // evil
  findReply = (id: string | undefined) => {
    return this.forumPosts.find((post) => post.id === id) ?? this.post.find((post) => post.id === id)
  }

  // local pagination
  currentPage = 0
  itemsPerPage = 50

  // icons
  rewootIcon = faRepeat

  homeIcon = faHome
  constructor(
    private forumService: ForumService,
    private route: ActivatedRoute,
    readonly loginService: LoginService,
    private postService: PostsService,
    private readonly dashboardService: DashboardService,
    private readonly scrollService: ScrollService,
    private readonly router: Router
  ) {
    this.followedUsers = this.postService.followedUserIds
    this.notYetAcceptedFollows = this.postService.notYetAcceptedFollowedUsersIds
    this.updateFollowsSubscription = this.postService.updateFollowers.subscribe(() => {
      this.followedUsers = this.postService.followedUserIds
      this.notYetAcceptedFollows = this.postService.notYetAcceptedFollowedUsersIds
    })
    this.userLoggedIn = loginService.checkUserLoggedIn()
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID()
    }
    this.subscription = this.route.params.subscribe(async (data: any) => {
      this.loading = true
      let postId: string = ''
      if (data.id) {
        postId = data.id
        const tmpTmpPost = this.dashboardService.getPostV2(postId)
        const tmpPost = await tmpTmpPost
        this.post = tmpPost ? tmpPost : []
      } else if (data.blog && data.title) {
        // TODO article petition
      }
      const tmpForumPosts = this.forumService.getForumThread(postId)
      this.forumPosts = await tmpForumPosts
      this.loading = false
    })
  }
  ngOnInit(): void {
    this.scrollService.setScrollContext(ScrollContext.Inactive);

    this.navigationStart = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
      });

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
    this.loading = true
    await this.postService.loadRepliesFromFediverse(this.post[this.post.length - 1].id)
    this.forumPosts = await this.forumService.getForumThread(this.post[this.post.length - 1].id)
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
