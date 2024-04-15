import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoaderComponent } from 'src/app/components/loader/loader.component';
import { PostActionsComponent } from 'src/app/components/post-actions/post-actions.component';
import { PostFragmentComponent } from 'src/app/components/post-fragment/post-fragment.component';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { ForumService } from 'src/app/services/forum.service';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PostFragmentComponent,
    LoaderComponent,
    MatCardModule,
    MatButtonModule,
    PostActionsComponent,
  ],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss',
})
export class ForumComponent implements OnDestroy {
  loading = true;
  posts: ProcessedPost[] = [];
  subscription: Subscription;
  updateFollowsSubscription: Subscription;
  userLoggedIn = false;
  myId = '';
  notYetAcceptedFollows: string[] = [];
  followedUsers: string[] = [];
  constructor(
    private forumService: ForumService,
    private route: ActivatedRoute,
    private loginService: LoginService,
    private postService: PostsService
  ) {
    this.followedUsers = this.postService.followedUserIds;
    this.notYetAcceptedFollows =
      this.postService.notYetAcceptedFollowedUsersIds;
      this.updateFollowsSubscription = this.postService.updateFollowers.subscribe(() => {
        this.followedUsers = this.postService.followedUserIds;
        this.notYetAcceptedFollows =
          this.postService.notYetAcceptedFollowedUsersIds;
      });
    this.userLoggedIn = loginService.checkUserLoggedIn();
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID();
    }
    this.subscription = this.route.params.subscribe(async (data: any) => {
      this.loading = true;
      this.posts = (await this.forumService.getForumThread(data.id));
      this.loading = false;
    });
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.updateFollowsSubscription.unsubscribe();
  }

  followUser(id: string) { }

  unfollowUser(id: string) { }

  scrollTo(id: string) {
    document.getElementById('post-' + id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest"
      });
    }
}
