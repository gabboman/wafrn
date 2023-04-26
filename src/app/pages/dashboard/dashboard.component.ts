import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';
import { JwtService } from 'src/app/services/jwt.service';
import { PostsService } from 'src/app/services/posts.service';
import { Title, Meta } from '@angular/platform-browser';

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
  level = 1;



  constructor(
    private dashboardService: DashboardService,
    private jwtService: JwtService,
    private router: Router,
    private postService: PostsService,
    private messages: MessageService,
    private titleService: Title,
    private metaTagService: Meta

  ) {
    this.titleService.setTitle('Wafrn - the social network that respects you');
    this.metaTagService.addTags([
      {name: 'description', content: 'Explore the posts in wafrn and if it looks cool join us!'},
      {name: 'og:description', content: 'Explore the posts in wafrn and if it looks cool join us!' },
    ]);
   }

  async ngOnInit(): Promise<void> {
    if(this.router.url.endsWith('explore')) {
      this.level = 0;
    }
    if(this.router.url.endsWith('exploreLocal')) {
      this.level = 2;
    }
    if(this.router.url.endsWith('private')) {
      this.level = 10;
    }
    if(!(this.jwtService.tokenValid() || (this.router.url.endsWith('explore') || this.router.url.endsWith('exploreLocal')))) {
      localStorage.clear();
      this.router.navigate(['/']);
    }
    this.postService.updateFollowers.subscribe( () => {
      if(this.postService.followedUserIds.length === 1 && this.level === 1  ){
        // if the user follows NO ONE we take them to the explore page!
        this.messages.add({ severity: 'info', summary: 'You aren\'t following anyone, so we took you to the explore page' });
        this.router.navigate(['/dashboard/localExplore']);
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
      const thisFragmentSeen = this.viewedPostsIds.indexOf(component.id) !== -1 ||  component.content === '';
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

  generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}



  async loadPosts(page: number) {

    let tmpPosts = await this.dashboardService.getDashboardPage(page, this.level);
    // internal posts, and stuff could be added here.
    // also some ads for RAID SHADOW LEGENDS. This is a joke.
    // but hey if you dont like it you delete that very easily ;D
    if(!this.jwtService.tokenValid()) {
      this.posts.push([{
        id: this.generateUUID() ,
        content_warning: '',
        content: "<p>To fully enjoy this hellsite, please consider joining us, <a href=\"/register\" rel=\"noopener noreferrer\" target=\"_blank\">register into wafrn!</a></p><p><br></p><p>bring your twisted ideas onto others, share recipies of cake that swap the flour for mayo or hot sauce!</p><p><br></p><p><br></p><p>Consider <a href=\"/register\" rel=\"noopener noreferrer\" target=\"_blank\">joining wafrn</a>!</p>",
        createdAt:      new Date(),
        updatedAt:      new Date(),
        userId: "40472b5b-b668-4156-b795-a60f2986e928",
        user: {
          avatar: "/1641804617334_2f7de58d61c79f0bca67869c5b375f74a3787a17.webp",
          url: "admin",
          description: "admin",
          id: "admin",
        },
        medias: [],
        tags: [],
        notes: 0,
        remotePostId: '',
        privacy: 0

      }]);
    }
    tmpPosts.forEach(post => {
      this.postsToHideArray.push(false);
      this.posts.push(post);
    })
  }



}
