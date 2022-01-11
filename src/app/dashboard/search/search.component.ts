import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';
import { DashboardService } from 'src/app/services/dashboard.service';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {


  baseMediaUrl = environment.baseMediaUrl;
  searchForm: FormGroup = new FormGroup({
    search: new FormControl('', [Validators.required])
  });
  currentSearch = '';
  posts: ProcessedPost[][] = [];
  viewedPosts = 0;
  users: SimplifiedUser[] = [];
  viewedUsers = 0;
  followedUsers: Array<String> = [];
  userLoggedIn = false;

  menuItems: MenuItem[] = [
    {
      label: 'Write',
      icon: "pi pi-pencil",
      command: () => {this.router.navigate(['/dashboard']); setTimeout(()=> {this.postService.launchPostEditorEmitter.next('')}, 500)}
    },
    {
      label: 'Search',
      icon: "pi pi-search",
      routerLink: '/dashboard/search'
    },
    {
      label: 'My blog',
      icon: "pi pi-user",
      routerLink: '/blog/'
    },
    {
      label: 'Profile',
      icon: "pi pi-cog",
      disabled: true
    },
    {
      label: 'Log out',
      icon: 'pi pi-sign-out',
      command: () => {localStorage.clear(); this.router.navigate(['/'])}
    }
  ];
  
  constructor(
    private dashboardService: DashboardService,
    private messages: MessageService,
    private postService: PostsService,
    private loginService: LoginService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit(): Promise<void> {
    this.followedUsers = this.postService.followedUserIds;
    this.postService.updateFollowers.subscribe( () => {
      this.followedUsers = this.postService.followedUserIds;
    } );
    this.userLoggedIn = this.loginService.checkUserLoggedIn();
    if(this.activatedRoute.snapshot.paramMap.get('term')) {
      this.searchForm.patchValue({
        search: this.activatedRoute.snapshot.paramMap.get('term')
      });
      await this.submitSearch();
    }

  }

  async submitSearch() {

    this.currentSearch = this.searchForm.value['search'];
    let searchResult = await this.dashboardService.getSearchPage(0, this.currentSearch);
    this.viewedPosts = 0;
    this.viewedUsers = 0;
    this.posts = searchResult.posts;
    this.users = searchResult.users;


    
  }

  async loadResults(page: number) {
    let searchResult = await this.dashboardService.getSearchPage(page, this.currentSearch);
    searchResult.posts.forEach((post) => this.posts.push(post));
    searchResult.users.forEach((user) => this.users.push(user));
  }

  async countViewedPost() {
    this.viewedPosts++;
    if (this.posts.length - 3 < this.viewedPosts) {
      await this.loadResults(Math.floor(this.posts.length / 20));
    }
  }

  async countViewedUser() {
    this.viewedUsers ++;
    if (this.users.length - 3 < this.viewedUsers) {
      await this.loadResults(Math.floor(this.posts.length / 20));
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

  async unfollowUser(id: string) {
    let response = await this.postService.unfollowUser(id);
    if(response) {
      this.messages.add({ severity: 'success', summary: 'You no longer follow this user!' });
    } else {
      this.messages.add({ severity: 'error', summary: 'Something went wrong! Check your internet conectivity and try again' });
    }

  }

}
