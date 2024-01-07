import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';
import { JwtService } from 'src/app/services/jwt.service';
import { PostsService } from 'src/app/services/posts.service';
import { Title, Meta } from '@angular/platform-browser';
import { ThemeService } from 'src/app/services/theme.service';
import { MessageService } from 'src/app/services/message.service';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  loadingPosts = false;
  noMorePosts = false;
  posts: ProcessedPost[][] = [];
  viewedPostsNumber = 0;
  viewedPostsIds: string[] = [];
  currentPage = 0;
  level = 1;
  title = '';
  reloadIcon = faArrowsRotate;

  constructor(
    private dashboardService: DashboardService,
    private jwtService: JwtService,
    private router: Router,
    private postService: PostsService,
    private messages: MessageService,
    private titleService: Title,
    private metaTagService: Meta,
    private themeService: ThemeService
  ) {
    this.titleService.setTitle('Wafrn - the social network that respects you');
    this.metaTagService.addTags([
      {
        name: 'description',
        content: 'Explore the posts in wafrn and if it looks cool join us!',
      },
      {
        name: 'og:description',
        content: 'Explore the posts in wafrn and if it looks cool join us!',
      },
    ]);
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    if (this.router.url.endsWith('explore')) {
      this.level = 0;
      this.title = 'Explore the fediverse';
    }
    if (this.router.url.endsWith('exploreLocal')) {
      this.level = 2;
      this.title = 'Explore WAFRN';
    }
    if (this.router.url.endsWith('private')) {
      this.level = 10;
      this.title = 'Private messages';
    }
    this.postService.updateFollowers.subscribe(() => {
      if (this.postService.followedUserIds.length === 1 && this.level === 1) {
        // if the user follows NO ONE we take them to the explore page!
        this.messages.add({
          severity: 'info',
          summary:
            "You aren't following anyone, so we took you to the explore page",
        });
        this.router.navigate(['/dashboard/exploreLocal']);
      }
    });
    this.loadPosts(this.currentPage).then(() => {
      setTimeout(() => {
        // we detect the bottom of the page and load more posts
        const element = document.querySelector(
          '#if-you-see-this-load-more-posts'
        );
        const observer = new IntersectionObserver(
          (intersectionEntries: IntersectionObserverEntry[]) => {
            if (intersectionEntries[0].isIntersecting) {
              this.currentPage++;
              this.loadPosts(this.currentPage);
            }
          }
        );
        if (element) {
          observer.observe(element);
        }
      });
    });
    this.themeService.setMyTheme();
  }

  reloadPosts() {
    this.posts = [];
    this.currentPage = 0;
    this.viewedPostsNumber = 0;
    this.viewedPostsIds = [];
    this.loadPosts(this.currentPage);
    window.scrollTo(0, 0);
  }

  async countViewedPost() {
    this.viewedPostsNumber++;
    if (this.posts.length - 1 < this.viewedPostsNumber) {
      this.currentPage++;
      await this.loadPosts(this.currentPage);
    }
  }

  async loadPosts(page: number) {
    this.loadingPosts = true;
    let scrollDate = new Date();
    if (page !== 0) {
      const lastPostBlock = this.posts[this.posts.length - 1];
      scrollDate = new Date(lastPostBlock[lastPostBlock.length - 1].createdAt);
    }
    const tmpPosts = await this.dashboardService.getDashboardPage(
      scrollDate,
      this.level
    );
    this.noMorePosts = tmpPosts.length === 0;
    const filteredPosts = tmpPosts.filter((post: ProcessedPost[]) => {
      let allFragmentsSeen = true;
      post.forEach((component) => {
        const thisFragmentSeen =
          this.viewedPostsIds.indexOf(component.id) !== -1 ||
          (component.content === '' &&
            component.tags.length === 0 &&
            component.medias?.length === 0);
        allFragmentsSeen = thisFragmentSeen && allFragmentsSeen;
        if (!thisFragmentSeen) {
          this.viewedPostsIds.push(component.id);
        }
      });
      return !allFragmentsSeen;
    });

    // we do the filtering here to avoid repeating posts. Also by doing it here we avoid flickering

    // internal posts, and stuff could be added here.
    // also some ads for RAID SHADOW LEGENDS. This is a joke.
    // but hey if you dont like it you delete that very easily ;D
    if (!this.jwtService.tokenValid()) {
      this.posts.push([
        {
          id: '872c9649-5043-460e-a9df-c35a568c8aef',
          content_warning: '',
          content:
            '<p>To fully enjoy this hellsite, please consider joining us, <a href="/register" rel="noopener noreferrer" target="_blank">register into wafrn!</a></p><p><br></p><p>bring your twisted ideas onto others, share recipies of cake that swap the flour for mayo or hot sauce!</p><p><br></p><p><br></p><p>Consider <a href="/register" rel="noopener noreferrer" target="_blank">joining wafrn</a>!</p>',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: '40472b5b-b668-4156-b795-a60f2986e928',
          user: {
            avatar:
              '/1641804617334_2f7de58d61c79f0bca67869c5b375f74a3787a17.webp',
            url: 'admin',
            name: 'admin',
            id: 'admin',
          },
          medias: [],
          tags: [],
          notes: 0,
          remotePostId: '',
          privacy: 0,
          userLikesPostRelations: [],
          emojis: [],
          descendents: [],
        },
      ]);
    }
    filteredPosts.forEach((post) => {
      this.posts.push(post);
    });
    // if we get a lot of filtered posts, we might want to load the next page
    if (tmpPosts.length > 5 && filteredPosts.length < 5) {
      this.currentPage = this.currentPage + 1;
      await this.loadPosts(this.currentPage);
    }
    this.loadingPosts = false;
  }
}
