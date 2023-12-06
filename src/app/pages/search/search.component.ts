import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { filter } from 'rxjs';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';
import { DashboardService } from 'src/app/services/dashboard.service';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';
import { ThemeService } from 'src/app/services/theme.service';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {

  cacheurl = environment.externalCacheurl;
  baseMediaUrl = environment.baseMediaUrl;
  searchForm: UntypedFormGroup = new UntypedFormGroup({
    search: new UntypedFormControl('', [Validators.required])
  });
  currentSearch = '';
  posts: ProcessedPost[][] = [];
  viewedPosts = 0;
  users: SimplifiedUser[] = [];
  avatars: any = {};
  viewedUsers = 0;
  followedUsers: Array<string> = [];
  userLoggedIn = false;
  currentPage = 0;
  loading = false;
  navigationSubscription;

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
    this.navigationSubscription = router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((ev)=> {
      this.ngOnInit()
    })
  }
  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.followedUsers = this.postService.followedUserIds;
    this.postService.updateFollowers.subscribe( () => {
      this.followedUsers = this.postService.followedUserIds;
    } );
    this.userLoggedIn = this.loginService.checkUserLoggedIn();
    if(this.activatedRoute.snapshot.paramMap.get('term')) {
      this.searchForm.patchValue({
        search: this.activatedRoute.snapshot.paramMap.get('term')
      });
      this.submitSearch();
    }

  }

  async submitSearch() {
    this.loading = true;
    this.viewedPosts = 0;
    this.viewedUsers = 0;
    this.currentPage = 0;
    this.currentSearch = this.searchForm.value['search'];
    const searchResult = await this.dashboardService.getSearchPage(this.currentPage, this.currentSearch);
    this.posts = searchResult.posts;
    this.users = searchResult.users;
    searchResult.users.forEach((user) => {
      this.avatars[user.url] = user.url.startsWith('@') ? this.cacheurl + encodeURIComponent(user.avatar) : this.baseMediaUrl + user.avatar;
    })
    this.loading = false;
  }

  async loadResults(page: number) {
    const searchResult = await this.dashboardService.getSearchPage(page, this.currentSearch);
    searchResult.posts.forEach((post) => this.posts.push(post));
    searchResult.users.forEach((user) => {
      this.users.push(user);
      this.avatars[user.url] = user.url.startsWith('@') ? this.cacheurl + encodeURIComponent(user.avatar) : this.baseMediaUrl + user.avatar;
    });
  }

  async countViewedPost() {
    this.viewedPosts++;
    if (this.posts.length - 3 < this.viewedPosts) {
      this.currentPage++;
      await this.loadResults(this.currentPage);
    }
  }

  async countViewedUser() {
    this.viewedUsers ++;
    if (this.users.length - 3 < this.viewedUsers) {
      this.currentPage++;
      await this.loadResults(this.currentPage);
    }
  }

  async followUser(id: string) {
    const response = await this.postService.followUser(id);
    if(response) {
      this.messages.add({ severity: 'success', summary: 'You now follow this user!' });
    } else {
      this.messages.add({ severity: 'error', summary: 'Something went wrong! Check your internet conectivity and try again' });
    }
  }

  async unfollowUser(id: string) {
    const response = await this.postService.unfollowUser(id);
    if(response) {
      this.messages.add({ severity: 'success', summary: 'You no longer follow this user!' });
    } else {
      this.messages.add({ severity: 'error', summary: 'Something went wrong! Check your internet conectivity and try again' });
    }

  }

}
