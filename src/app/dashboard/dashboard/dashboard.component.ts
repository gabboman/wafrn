import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';
import { JwtService } from 'src/app/services/jwt.service';
import { PostsService } from 'src/app/services/posts.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  posts: ProcessedPost[][] = [];
  viewedPostsNumber = 0;
  viewedPostsIds: string[] = [];
  postsToHideArray: boolean[] = [];
  currentPage= 0;
  explore = false;



  constructor(
    private dashboardService: DashboardService,
    private jwtService: JwtService,
    private router: Router,
    private postService: PostsService,
    private messages: MessageService,

  ) { }

  async ngOnInit(): Promise<void> {
    if(this.router.url.indexOf('explore') != -1) {
      this.explore = true;
    }
    if(!this.jwtService.tokenValid()) {
      localStorage.clear();
      this.router.navigate(['/']);
    }
    this.postService.updateFollowers.subscribe( () => {
      if(this.postService.followedUserIds.length === 1 ){
        // if the user follows NO ONE we take them to the explore page!
        this.messages.add({ severity: 'info', summary: 'You follow no one, so we took you to the explore page' });
        this.router.navigate(['/dashboard/explore']);
      }
    } );
    await this.loadPosts(this.currentPage);

  }

  async countViewedPost(index: number) {
    const post: ProcessedPost[] = this.posts[index];
    this.viewedPostsNumber++;
    if (this.posts.length - 1 < this.viewedPostsNumber) {
      this.currentPage ++;
      await this.loadPosts(this.currentPage);
    }
    let allFragmentsSeen = true;
    post.forEach(component => {
      const thisFragmentSeen = this.viewedPostsIds.indexOf(component.id) !== -1;
      allFragmentsSeen =  thisFragmentSeen && allFragmentsSeen;
      if(!thisFragmentSeen) {
        this.viewedPostsIds.push(component.id)
      }
    });
    if(allFragmentsSeen) {
      if(index >= 0) {
        this.postsToHideArray[index] = true;
      }
    }
  }

  async loadPosts(page: number) {

    let tmpPosts = await this.dashboardService.getDashboardPage(page, this.explore);
    tmpPosts.forEach(post => {
      this.postsToHideArray.push(false);
      this.posts.push(post);
    })
  }



}
