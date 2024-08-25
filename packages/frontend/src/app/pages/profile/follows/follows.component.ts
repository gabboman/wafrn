import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, NavigationEnd, Router, RouterModule, UrlSegment } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { BlogHeaderComponent } from 'src/app/components/blog-header/blog-header.component';
import { LoaderComponent } from 'src/app/components/loader/loader.component';
import { followsResponse } from 'src/app/interfaces/follows-response';
import { DashboardService } from 'src/app/services/dashboard.service';
import { BlogService } from 'src/app/services/blog.service';
import { PostsService } from 'src/app/services/posts.service';
import { environment } from 'src/environments/environment';
import { AvatarSmallComponent } from "../../../components/avatar-small/avatar-small.component";
import { LoginService } from 'src/app/services/login.service';
import { faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';

@Component({
  selector: 'app-follows',
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    BlogHeaderComponent,
    MatTableModule,
    MatPaginatorModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    RouterModule,
    AvatarSmallComponent,
    FontAwesomeModule
  ],
  templateUrl: './follows.component.html',
  styleUrl: './follows.component.scss'
})
export class FollowsComponent implements OnInit, OnDestroy {
  navigationSubscription: Subscription
  followsSubscription: Subscription;
  loading = true;
  blogDetails: any;
  followedUsers: string[] = [];
  notYetAcceptedFollows: string[] = [];
  blogUrl: string = '';
  found = true;
  following = false;
  displayedColumns = ['avatar', 'url', 'date', 'actions', 'removeFollower'];
  myId: string;
  deleteIcon = faTrash;
  acceptIcon = faCheck;

  @ViewChild(MatPaginator) paginator!: MatPaginator;


  dataSource!: MatTableDataSource<followsResponse, MatPaginator>;

  constructor(
    private loginService: LoginService,
    public activatedRoute: ActivatedRoute,
    private router: Router,
    public postService: PostsService,
    private dashboardService: DashboardService,
    private blogService: BlogService
  ) {
    this.myId = loginService.getLoggedUserUUID()
    this.followsSubscription = this.postService.updateFollowers.subscribe(() => {
      this.followedUsers = this.postService.followedUserIds;
      this.notYetAcceptedFollows = this.postService.notYetAcceptedFollowedUsersIds;
    })
    this.navigationSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loading = true;
        this.ngOnInit();
      });
  }

  async ngOnInit(): Promise<void> {
    this.dataSource = new MatTableDataSource<followsResponse, MatPaginator>([]);
    this.blogUrl = this.activatedRoute.snapshot.paramMap.get('url') as string;
    this.following = !!this.activatedRoute.snapshot.routeConfig?.path?.toLowerCase()?.endsWith('following')
    const blogPromise = this.dashboardService
      .getBlogDetails(this.blogUrl)
      .catch(() => {
        this.found = false;
        this.loading = false;
      });
    let followsPromise = this.blogService.getFollowers(this.blogUrl, this.following)
    await Promise.all([blogPromise, followsPromise]);
    const blogResponse = await blogPromise;
    const followsResponse = await followsPromise;
    if (blogResponse) {
      this.blogDetails = blogResponse;
      this.dataSource.data = followsResponse
      this.loading = false;
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
      });

    }
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
    this.followsSubscription.unsubscribe();
  }

  async deleteFollower(user: SimplifiedUser) {
    await this.blogService.deleteFollow(user.id)
    this.ngOnInit();
  }

  async acceptFollower(user: SimplifiedUser) {
    await this.blogService.approveFollow(user.id)
    this.ngOnInit();
  }

}
