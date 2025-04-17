import { Component, OnDestroy, OnInit, signal } from '@angular/core'
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { Subscription, filter } from 'rxjs'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { SimplifiedUser } from 'src/app/interfaces/simplified-user'
import { DashboardService } from 'src/app/services/dashboard.service'
import { EnvironmentService } from 'src/app/services/environment.service'
import { LoginService } from 'src/app/services/login.service'
import { MessageService } from 'src/app/services/message.service'
import { PostsService } from 'src/app/services/posts.service'
import { ThemeService } from 'src/app/services/theme.service'

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  standalone: false
})
export class SearchComponent implements OnInit, OnDestroy {
  cacheurl = EnvironmentService.environment.externalCacheurl
  baseMediaUrl = EnvironmentService.environment.baseMediaUrl
  searchForm: UntypedFormGroup = new UntypedFormGroup({
    search: new UntypedFormControl('', [Validators.required])
  })
  currentSearch = ''
  posts = signal<ProcessedPost[][]>([]);
  viewedPosts = 0
  users = signal<SimplifiedUser[]>([])
  avatars: Record<string, string> = {}
  viewedUsers = 0
  followedUsers: string[] = []
  notYetAcceptedFollows: string[] = []

  userLoggedIn = false
  currentPage = 0
  loading = signal(false);
  navigationSubscription: Subscription
  updateFollowersSubscription: Subscription
  searchIcon = faSearch
  atLeastOneSearchDone = false

  constructor(
    private dashboardService: DashboardService,
    private messages: MessageService,
    private postService: PostsService,
    private loginService: LoginService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private themeService: ThemeService
  ) {
    this.themeService.setMyTheme()
    this.navigationSubscription = router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.ngOnInit()
      })
    this.updateFollowersSubscription = this.postService.updateFollowers.subscribe(() => {
      this.followedUsers = this.postService.followedUserIds
      this.notYetAcceptedFollows = this.postService.notYetAcceptedFollowedUsersIds
    })
  }
  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe()
    this.updateFollowersSubscription.unsubscribe()
  }

  ngOnInit(): void {
    this.followedUsers = this.postService.followedUserIds
    this.notYetAcceptedFollows = this.postService.notYetAcceptedFollowedUsersIds
    this.userLoggedIn = this.loginService.checkUserLoggedIn()
    if (this.activatedRoute.snapshot.paramMap.get('term')) {
      this.searchForm.patchValue({
        search: this.activatedRoute.snapshot.paramMap.get('term')
      })
      this.submitSearch()
    }
  }

  getAvatar(url: string) {
    return this.avatars[url]
  }

  async submitSearch() {
    this.loading.set(true);
    this.atLeastOneSearchDone = true
    this.viewedPosts = 0
    this.viewedUsers = 0
    this.currentPage = 0
    this.posts.set([]);
    this.users.set([]);
    this.currentSearch = this.searchForm.value['search']
    const searchResult = await this.dashboardService.getSearchPage(this.currentPage, this.currentSearch)
    this.posts.set(searchResult.posts);
    this.users.set(searchResult.users);
    searchResult.users.forEach((user) => {
      this.avatars[user.url] = user.url.startsWith('@')
        ? this.cacheurl + encodeURIComponent(user.avatar)
        : this.cacheurl + encodeURIComponent(this.baseMediaUrl + user.avatar)
    })
    this.loading.set(false);

    setTimeout(() => {
      // we detect the bottom of the page and load more posts
      const element = document.querySelector('#if-you-see-this-load-more-posts')
      const observer = new IntersectionObserver((intersectionEntries: IntersectionObserverEntry[]) => {
        if (intersectionEntries[0].isIntersecting) {
          this.currentPage++
          this.loadResults(this.currentPage)
        }
      })
      if (element) {
        observer.observe(element)
      }
    })
  }

  async loadResults(page: number) {
    const searchResult = await this.dashboardService.getSearchPage(page, this.currentSearch)
    searchResult.posts.forEach((post) => this.posts().push(post))
    searchResult.users.forEach((user) => {
      this.users().push(user)
      this.avatars[user.url] = user.url.startsWith('@')
        ? this.cacheurl + encodeURIComponent(user.avatar)
        : this.cacheurl + encodeURIComponent(this.baseMediaUrl + user.avatar)
    })
  }

  async followUser(id: string) {
    const response = await this.postService.followUser(id)
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: 'You now follow this user!'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong! Check your internet conectivity and try again'
      })
    }
  }

  async unfollowUser(id: string) {
    const response = await this.postService.unfollowUser(id)
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: 'You no longer follow this user!'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong! Check your internet conectivity and try again'
      })
    }
  }
}
