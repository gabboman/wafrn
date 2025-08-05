import { Component, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'
import { ActivatedRoute, Router } from '@angular/router'
import {
  faArrowUpRightFromSquare,
  faClockRotateLeft,
  faHeart,
  faHeartBroken,
  faHome,
  faReply,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons'
import { Subscription } from 'rxjs'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { BlocksService } from 'src/app/services/blocks.service'
import { DashboardService } from 'src/app/services/dashboard.service'
import { LoginService } from 'src/app/services/login.service'
import { ThemeService } from 'src/app/services/theme.service'

import { MatDialog } from '@angular/material/dialog'
import { AcceptThemeComponent } from 'src/app/components/accept-theme/accept-theme.component'
import { BlogDetails } from 'src/app/interfaces/blogDetails'
import { EnvironmentService } from 'src/app/services/environment.service'
import { SimplifiedUser } from 'src/app/interfaces/simplified-user'
import { snappyInject, SnappyRouter } from 'src/app/components/snappy/snappy-router.component'
import { SnappyBlogData } from 'src/app/directives/blog-link/blog-link.directive'
import { SnappyHide, SnappyShow } from 'src/app/components/snappy/snappy-life'

@Component({
  selector: 'app-view-blog',
  templateUrl: './view-blog.component.html',
  styleUrls: ['./view-blog.component.scss'],
  standalone: false
})
export class ViewBlogComponent implements OnInit, OnDestroy, SnappyHide, SnappyShow {
  loading = signal<boolean>(true)
  loadingBlog = signal<boolean>(true)
  noMorePosts = false
  found = true
  viewedPosts = 0
  currentPage = 0
  posts: ProcessedPost[][] = []
  blogUrl: string = ''
  avatarUrl = ''
  blogDetails = signal<BlogDetails | undefined>(undefined)
  userLoggedIn = false
  paramSubscription!: Subscription
  showModalTheme = false
  viewedPostsIds: string[] = []
  intersectionObserverForLoadPosts!: IntersectionObserver

  simpleUser?: SimplifiedUser
  useSimple = signal<boolean>(false)

  shareExternalIcon = faArrowUpRightFromSquare
  solidHeartIcon = faHeart
  clearHeartIcon = faHeartBroken
  reblogIcon = faReply
  quickReblogIcon = faClockRotateLeft
  reportIcon = faTriangleExclamation
  homeIcon = faHome

  scrollId!: number
  viewingPost!: WritableSignal<boolean>

  test = snappyInject(SnappyBlogData)

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly dashboardService: DashboardService,
    readonly loginService: LoginService,
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly metaTagService: Meta,
    private readonly themeService: ThemeService,
    public readonly blockService: BlocksService,
    private readonly dialog: MatDialog,
    private readonly snappy: SnappyRouter
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn()
  }
  snOnShow(): void {
    const blogDetails = this.blogDetails()
    if (blogDetails) {
      this.handleTheme(blogDetails)
    }
  }

  snOnHide(): void {
    if (this.userLoggedIn) {
      this.themeService.setMyTheme()
    } else {
      this.themeService.setCustomCSS('')
    }
  }

  ngOnDestroy(): void {
    this.paramSubscription.unsubscribe()
  }

  async ngOnInit() {
    this.paramSubscription = this.activatedRoute.params.subscribe((e) => {
      this.currentPage = 0
      this.blogUrl = ''
      this.avatarUrl = ''
      this.snappy.claim()

      let data = this.test(this.snappy)?.blog
      if (data?.url) {
        this.simpleUser = data
      }
      this.blogDetails.set(undefined)
      if (this.simpleUser) {
        const blogDetails = this.simpleToBlog(this.simpleUser)
        this.blogDetails.set(blogDetails)
        this.avatarUrl = this.getAvatarUrl(blogDetails)
        this.useSimple.set(true)
      }
      this.configureUser(true)
    })
  }

  private getAvatarUrl(blogDetails: BlogDetails): string {
    return blogDetails.url.startsWith('@')
      ? EnvironmentService.environment.externalCacheurl + encodeURIComponent(blogDetails.avatar)
      : EnvironmentService.environment.externalCacheurl +
          encodeURIComponent(EnvironmentService.environment.baseMediaUrl + blogDetails.avatar)
  }

  async configureUser(reload: boolean) {
    this.loadingBlog.set(true)
    this.loading.set(true)

    const blogUrl = this.activatedRoute.snapshot.paramMap.get('url')
    if (blogUrl) {
      this.blogUrl = blogUrl
    }

    const blogResponse = await this.dashboardService.getBlogDetails(this.blogUrl).catch(() => {
      this.found = false
      this.loading.set(false)
    })

    this.useSimple.set(false)
    if (blogResponse) {
      const blogDetails = blogResponse
      this.blogDetails.set(blogDetails)
      this.avatarUrl = this.getAvatarUrl(blogResponse)
      this.titleService.setTitle(`${this.blogDetails()!.url}'s blog`)
      this.metaTagService.addTags([
        {
          name: 'description',
          content: `${this.blogDetails()!.url}'s wafrn blog`
        },
        { name: 'author', content: this.blogDetails()!.url },
        { name: 'image', content: this.avatarUrl }
      ])
      if (reload) {
        this.loading.set(false)
        this.reloadPosts()
      }
      this.useSimple.set(false)
      this.handleTheme(blogDetails)
    }

    this.intersectionObserverForLoadPosts = new IntersectionObserver(
      (intersectionEntries: IntersectionObserverEntry[]) => {
        if (intersectionEntries[0].isIntersecting) {
          this.currentPage++
          this.loadPosts(this.currentPage)
        }
      }
    )

    this.loadPosts(this.currentPage).then(() => {
      setTimeout(() => {
        const element = document.querySelector('#if-you-see-this-load-more-posts')
        if (element) {
          this.intersectionObserverForLoadPosts.observe(element)
        }
      })
    })

    this.loadingBlog.set(false)
  }

  handleTheme(blogDetails: BlogDetails) {
    const userHasCustomTheme = !blogDetails.url.startsWith('@')

    if (userHasCustomTheme) {
      let userResponseToCustomThemes = this.themeService.hasUserAcceptedCustomThemes()

      if (userResponseToCustomThemes === 2) {
        this.themeService.setCustomCSS(blogDetails.id)
      }

      if (userResponseToCustomThemes === 0) {
        const dialogRef = this.dialog.open(AcceptThemeComponent, {
          autoFocus: false
        })
        dialogRef.afterClosed().subscribe(() => {
          userResponseToCustomThemes = this.themeService.hasUserAcceptedCustomThemes()
          if (userResponseToCustomThemes === 2) {
            this.themeService.setCustomCSS(blogDetails.id)
          }
        })
      }
    } else {
      this.themeService.setCustomCSS('')
    }
  }

  reloadPosts() {
    if (this.loading()) return
    this.posts = []
    this.currentPage = 0
    this.viewedPosts = 0
    this.viewedPostsIds = []
    this.loadPosts(this.currentPage)
  }

  async loadPosts(page: number) {
    if (this.blogUrl === '') {
      return
    }
    if (!this.blogDetails()) {
      return
    }
    if (!this.userLoggedIn && this.blogDetails()!.url.startsWith('@')) {
      this.loading.set(false)
      this.noMorePosts = true
      return
    }

    this.loading.set(true)

    const tmpPosts = await this.dashboardService.getBlogPage(page, this.blogUrl)
    const filteredPosts = tmpPosts.filter((post: ProcessedPost[]) => {
      let allFragmentsSeen = true
      post.forEach((component) => {
        const thisFragmentSeen = this.viewedPostsIds.includes(component.id)
        allFragmentsSeen = thisFragmentSeen && allFragmentsSeen
        if (!thisFragmentSeen) {
          this.viewedPostsIds.push(component.id)
        }
      })
      return !allFragmentsSeen
    })
    filteredPosts.forEach((post) => {
      this.posts.push(post)
    })
    this.loading.set(false)
    if (tmpPosts.length === 0) {
      this.noMorePosts = true
    }
  }

  private simpleToBlog(usr: SimplifiedUser): BlogDetails {
    return {
      id: usr.id,
      url: usr.url,
      name: usr.name,
      createdAt: '',
      description: '',
      descriptionMarkdown: '',
      remoteId: usr.remoteId ?? '',
      avatar: usr.avatar,
      federatedHostId: '',
      headerImage: '',
      followingCount: 0,
      followerCount: 0,
      manuallyAcceptsFollows: true,
      emojis: [],
      muted: false,
      blocked: false,
      serverBlocked: false,
      followed: 0,
      followers: 0,
      publicOptions: [],
      postCount: 0,
      isBlueskyUser: false,
      disableEmailNotifications: false,
      hideFollows: false,
      hideProfileNotLoggedIn: false
    }
  }
}
