import { Component, Inject, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';
import { LoginService } from 'src/app/services/login.service';
import { environment } from 'src/environments/environment';
import { PostsService } from 'src/app/services/posts.service';
import { ThemeService } from 'src/app/services/theme.service';
import { MatPaginator } from '@angular/material/paginator';
import { RawPost } from 'src/app/interfaces/raw-post';
import { MatTableDataSource } from '@angular/material/table';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';
@Component({
  selector: 'app-single-post',
  templateUrl: './single-post.component.html',
  styleUrls: ['./single-post.component.scss'],
})
export class SinglePostComponent implements OnDestroy {
  homeIcon = faHome;
  post: ProcessedPost[] = [];
  loading = true;
  blogUrl: string = '';
  blogDetails: any;
  mediaUrl = environment.baseMediaUrl;
  cacheUrl = environment.externalCacheurl;
  localUrl = environment.frontUrl;
  forceSSR = false;
  postFound = true;
  userLoggedIn = false;
  displayedColumns = ['user', 'action'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource!: MatTableDataSource<RawPost, MatPaginator>;
  routeParamsSubscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dashboardService: DashboardService,
    private postService: PostsService,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object,
    private themeService: ThemeService
  ) {
    this.themeService.setMyTheme();
    this.userLoggedIn = loginService.checkUserLoggedIn();
    this.routeParamsSubscription = this.route.params.subscribe(async (data: any) => {
      this.forceSSR = this.route.snapshot.queryParams['force-ssr'] === 'true';
      const tmpPost = await this.dashboardService
        .getPostV2(data ? data.id : '')
        .catch(() => {
          this.postFound = false;
          this.loading = false;
        });
      this.post = tmpPost ? tmpPost : [];
      if (
        this.post &&
        this.post.length > 0 &&
        this.post[this.post.length - 1].descendents
      ) {
        this.dataSource = new MatTableDataSource<any>([]);
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
        });
        this.postService.getDescendents(data.id).then((response) => {
          this.dataSource.data = response.descendents;
        });
      }
      const lastPostFragment = this.post[this.post.length - 1];
      if (lastPostFragment) {
        this.postFound = true;

        this.loading = false;
        //this.seoService.setSEOTags(`Wafrn - Post by ${lastPostFragment.user.url}`, `Wafrn post by ${lastPostFragment.user.url}: ${this.postService.getPostContentSanitized(lastPostFragment.content)}`, lastPostFragment.user.url, this.getImage(this.post));
      } else {
        this.postFound = false;
      }
    });
  }
  ngOnDestroy(): void {
    this.routeParamsSubscription.unsubscribe();
  }

  // gets either the first non video image from the last post, the fist non video image from the initial post OR the wafrn logo
  getImage(processedPost: ProcessedPost[]): string {
    const posterAvatar =
      environment.baseMediaUrl +
      processedPost[processedPost.length - 1]?.user.avatar;
    let res: string = posterAvatar
      ? posterAvatar
      : 'https://app.wafrn.net/favicon.ico';
    const firstPostMedias = processedPost[0]?.medias;
    if (firstPostMedias) {
      for (let i = 0; i < firstPostMedias.length; i++) {
        const mp4 = firstPostMedias[i].url.toLowerCase().endsWith('mp4');
        const nsfw = firstPostMedias[i].NSFW;
        if (!(mp4 || nsfw)) {
          res = firstPostMedias[i].url;
          break;
        }
      }
    }

    const lastPostMedias = processedPost[processedPost.length - 1]?.medias;
    if (lastPostMedias) {
      for (let i = 0; i < lastPostMedias.length; i++) {
        const mp4 = lastPostMedias[i].url.toLowerCase().endsWith('mp4');
        const nsfw = lastPostMedias[i].NSFW;
        if (!(mp4 || nsfw)) {
          res = lastPostMedias[i].url;
          break;
        }
      }
    }
    return res;
  }

  async loadRepliesFromFediverse() {
    this.loading = true;
    await this.postService.loadRepliesFromFediverse(
      this.post[this.post.length - 1].id
    );
    // a bit janky, could do something better but I feel like is the best option today.
    // TODO unjank this
    window.location.reload();
  }

  getUserAvatar(user: SimplifiedUser): string {
    return user.url.startsWith('@')
      ? this.cacheUrl + encodeURIComponent(user.avatar)
      : this.cacheUrl + encodeURIComponent(this.mediaUrl + user.avatar);
  }
}
