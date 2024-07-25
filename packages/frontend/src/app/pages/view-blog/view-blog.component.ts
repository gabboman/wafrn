import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  faArrowUpRightFromSquare,
  faChevronDown,
  faClockRotateLeft,
  faHeart,
  faHeartBroken,
  faHome,
  faReply,
  faServer,
  faTriangleExclamation,
  faUser,
  faUserSlash,
  faVolumeMute,
  faVolumeUp,
} from '@fortawesome/free-solid-svg-icons';
import { Subscription, filter } from 'rxjs';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { BlocksService } from 'src/app/services/blocks.service';
import { DashboardService } from 'src/app/services/dashboard.service';
import { LoginService } from 'src/app/services/login.service';
import { MessageService } from 'src/app/services/message.service';
import { PostsService } from 'src/app/services/posts.service';
import { ThemeService } from 'src/app/services/theme.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { AcceptThemeComponent } from 'src/app/components/accept-theme/accept-theme.component';
@Component({
  selector: 'app-view-blog',
  templateUrl: './view-blog.component.html',
  styleUrls: ['./view-blog.component.scss'],
})
export class ViewBlogComponent implements OnInit, OnDestroy {
  loading = true;
  noMorePosts = false;
  found = true;
  viewedPosts = 0;
  currentPage = 0;
  posts: ProcessedPost[][] = [];
  blogUrl: string = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blogDetails: any;
  userLoggedIn = false;
  avatarUrl = '';
  navigationSubscription!: Subscription;
  showModalTheme = false;
  viewedPostsIds: string[] = [];
  intersectionObserverForLoadPosts!: IntersectionObserver;

  
  shareExternalIcon = faArrowUpRightFromSquare;
  solidHeartIcon = faHeart;
  clearHeartIcon = faHeartBroken;
  reblogIcon = faReply;
  quickReblogIcon = faClockRotateLeft;
  reportIcon = faTriangleExclamation;
  homeIcon = faHome;

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
    public blockService: BlocksService,
    private dialog: MatDialog
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();

  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  async ngOnInit() {
    window.scrollTo(0, 0);
    this.navigationSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loading = true;
        this.found = true;
        this.viewedPosts = 0;
        this.currentPage = 0;
        this.posts = [];
        this.blogUrl = '';
        this.avatarUrl = '';
        this.ngOnInit();
      });


    const blogUrl = this.activatedRoute.snapshot.paramMap.get('url');
    if (blogUrl) {
      this.blogUrl = blogUrl;
    }

    const blogResponse = await this.dashboardService
      .getBlogDetails(this.blogUrl)
      .catch(() => {
        this.found = false;
        this.loading = false;
      });
    if (blogResponse && blogResponse.success !== false) {
      this.blogDetails = blogResponse;

      this.loadPosts(this.currentPage).then(() => {
        setTimeout(() => {
          const element = document.querySelector(
            '#if-you-see-this-load-more-posts'
          );
          if (element) {
            this.intersectionObserverForLoadPosts.observe(element);
          }
        });
      });
      this.avatarUrl = this.blogDetails.url.startsWith('@')
        ? environment.externalCacheurl +
          encodeURIComponent(this.blogDetails.avatar)
        : environment.externalCacheurl +
          encodeURIComponent(
            environment.baseMediaUrl + this.blogDetails.avatar
          );
      this.titleService.setTitle(`${this.blogDetails.url}'s blog`);
      this.metaTagService.addTags([
        {
          name: 'description',
          content: `${this.blogDetails.url}'s wafrn blog`,
        },
        { name: 'author', content: this.blogDetails.url },
        { name: 'image', content: this.avatarUrl },
      ]);
    }

    const userHasCustomTheme = !this.blogDetails.url.startsWith('@') //await this.themeService.checkThemeExists(this.blogDetails?.id);

    if (userHasCustomTheme) {
      let userResponseToCustomThemes =
        this.themeService.hasUserAcceptedCustomThemes();

      if (userResponseToCustomThemes === 2) {
        this.themeService.setTheme(this.blogDetails.id);
      }

      if (userResponseToCustomThemes === 0) {
        const dialogRef = this.dialog.open(AcceptThemeComponent);
        dialogRef.afterClosed().subscribe(() => {
          userResponseToCustomThemes =
            this.themeService.hasUserAcceptedCustomThemes();
          if (userResponseToCustomThemes === 2) {
            this.themeService.setTheme(this.blogDetails.id);
          }
        });
      }
    } else {
      this.themeService.setTheme('');
    }
    this.intersectionObserverForLoadPosts = new IntersectionObserver(
      (intersectionEntries: IntersectionObserverEntry[]) => {
        if (intersectionEntries[0].isIntersecting) {
          this.currentPage++;
          this.loadPosts(this.currentPage);
        }
      }
    );
  }

  async loadPosts(page: number) {
    this.loading = true;
    const tmpPosts = await this.dashboardService.getBlogPage(
      page,
      this.blogUrl
    );
    const filteredPosts = tmpPosts.filter((post: ProcessedPost[]) => {
      let allFragmentsSeen = true;
      post.forEach((component) => {
        const thisFragmentSeen = this.viewedPostsIds.includes(component.id);
        allFragmentsSeen = thisFragmentSeen && allFragmentsSeen;
        if (!thisFragmentSeen) {
          this.viewedPostsIds.push(component.id);
        }
      });
      return !allFragmentsSeen;
    });
    filteredPosts.forEach((post) => {
      this.posts.push(post);
    });
    this.loading = false;
    if (tmpPosts.length === 0) {
      this.noMorePosts = true;
    }
  }

}
