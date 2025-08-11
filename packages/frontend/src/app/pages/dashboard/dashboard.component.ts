import { ViewportScroller } from '@angular/common'
import { Component, OnDestroy, OnInit } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'
import { NavigationSkipped, Router } from '@angular/router'
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons'
import { Subscription } from 'rxjs'
import { filter } from 'rxjs/operators'
import { SnappyCreate, SnappyHide, SnappyShow } from 'src/app/components/snappy/snappy-life'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { DashboardService } from 'src/app/services/dashboard.service'
import { JwtService } from 'src/app/services/jwt.service'
import { MessageService } from 'src/app/services/message.service'
import { PostsService } from 'src/app/services/posts.service'
import { ThemeService } from 'src/app/services/theme.service'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit, OnDestroy, SnappyCreate, SnappyShow, SnappyHide {
  loadingPosts = false
  noMorePosts = false
  posts: ProcessedPost[][] = []
  viewedPostsNumber = 0
  viewedPostsIds: string[] = []
  currentPage = 0
  level = 1
  timestamp = new Date().getTime()
  title = ''
  updateFollowersSubscription?: Subscription
  navigationSubscription!: Subscription
  scroll = 0
  hideQuotesLevel = localStorage.getItem('hideQuotes') ? parseInt(localStorage.getItem('hideQuotes') as string) : 1

  // I don't think this is actually needed, but just in case!
  // Would like to have this a bit more cleanly integrated though
  snActive: boolean = false

  constructor(
    private dashboardService: DashboardService,
    private jwtService: JwtService,
    private router: Router,
    private postService: PostsService,
    private messages: MessageService,
    private titleService: Title,
    private metaTagService: Meta,
    private themeService: ThemeService,
    private readonly viewportScroller: ViewportScroller
  ) {
    this.titleService.setTitle('Wafrn - the social network that respects you')
    this.metaTagService.addTags([
      {
        name: 'description',
        content: 'Explore the posts in wafrn and if it looks cool join us!'
      },
      {
        name: 'og:description',
        content: 'Explore the posts in wafrn and if it looks cool join us!'
      }
    ])
  }
  snOnHide(): void {
    this.snActive = false
  }

  snOnCreate(): void {
    const purePath = this.router.url.split('?')[0]
    if (purePath.endsWith('explore')) {
      this.level = 0
      this.title = 'Wafrn and friends'
    }
    if (purePath.endsWith('exploreLocal')) {
      this.level = 2
      this.title = 'Explore WAFRN'
    }
    if (purePath.endsWith('private')) {
      this.level = 10
      this.title = 'Private messages'
    }
    if (purePath.endsWith('silencedPosts')) {
      this.level = 25
      this.title = 'My silenced posts'
    }
    if (purePath.endsWith('bookmarkedPosts')) {
      this.level = 50
      this.title = 'My bookmarked posts'
    }
  }

  snOnShow(): void {
    this.snActive = true
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe()
    this.updateFollowersSubscription?.unsubscribe()
  }

  ngOnInit(): void {
    // If the user clicks on the explore button while already on the page,
    // reload posts.
    this.navigationSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationSkipped))
      .subscribe(() => {
        if (window.scrollY > 0) {
          this.viewportScroller.scrollToPosition([0, 0])
          return
        }
        this.reloadPosts()
      })

    this.updateFollowersSubscription = this.postService.updateFollowers.subscribe(() => {
      if (this.postService.followedUserIds.length <= 1 && this.level === 1 && false) {
        // if the user follows NO ONE we take them to the explore page!
        this.messages.add({
          severity: 'info',
          summary: "You aren't following anyone, so we took you to the explore page"
        })
        this.router.navigate(['/dashboard/exploreLocal'])
      }
    })

    this.loadPosts(this.currentPage).then(() => {
      setTimeout(() => {
        this.themeService.setMyTheme()
        // we detect the bottom; of the page and load more posts
        const element = document.querySelector('#if-you-see-this-load-more-posts')
        const observer = new IntersectionObserver((intersectionEntries: IntersectionObserverEntry[]) => {
          if (intersectionEntries[0].isIntersecting) {
            this.currentPage++
            this.loadPosts(this.currentPage)
          }
        })
        if (element) {
          observer.observe(element)
        }
      })
    })
  }

  reloadPosts() {
    // Perhaps not a perfect solution, but without this guard currentPage and
    // startScroll may unexpectedly increase, leading to the dashboard
    // displaying posts that do not start from date.now
    if (this.loadingPosts || !this.snActive) return
    this.posts = []
    this.currentPage = 0
    this.viewedPostsNumber = 0
    this.viewedPostsIds = []
    this.timestamp = new Date().getTime()
    this.loadPosts(this.currentPage)
  }

  async countViewedPost() {
    this.viewedPostsNumber++
    if (this.posts.length - 1 < this.viewedPostsNumber) {
      this.currentPage++
      await this.loadPosts(this.currentPage)
    }
  }

  async loadPosts(page: number) {
    this.loadingPosts = true
    let scrollDate = new Date(this.timestamp)
    if (page == 0) {
      scrollDate = new Date()
      this.timestamp = scrollDate.getTime()
    }
    const tmpPosts = await this.dashboardService.getDashboardPage(scrollDate, this.level)
    this.noMorePosts = tmpPosts.length === 0
    if (this.noMorePosts && page == 0 && this.level === 1) {
      // no posts, no followers no nothing. lets a go to explore local
      this.router.navigate(['/dashboard/exploreLocal'])
    }
    // we do the filtering here to avoid repeating posts. Also by doing it here we avoid flickering
    const filteredPosts = tmpPosts
      .filter((post: ProcessedPost[]) => {
        const superMutedWordsRaw = localStorage.getItem('superMutedWords')
        let superMutedWords: string[] = []
        try {
          if (superMutedWordsRaw && superMutedWordsRaw.trim().length > 0) {
            superMutedWords = JSON.parse(superMutedWordsRaw)
              .split(',')
              .map((word: string) => word.trim().toLowerCase())
              .filter((word: string) => word.length > 0)
          }
        } catch (error) {
          this.messages.add({ severity: 'error', summary: 'Something wrong with your supermuted words!' })
        }
        // if quote level = 3 & post has quotes
        if (this.hideQuotesLevel == 3) {
          if (
            post.some((elem) => {
              !this.postService.followedUserIds.includes(elem.userId) ||
                (this.postService.usersQuotesDisabled.includes(elem.userId) && elem.quotes && elem.quotes.length)
            })
          ) {
            return true
          }
        }
        // textOfPosts
        let textOfPosts = post
          .map((elem) => {
            let text = '' + elem.content
            if (elem.content_warning) {
              text = text + ' ' + elem.content_warning
            }
            if (elem.tags && elem.tags.length > 0) {
              elem.tags.forEach((tag) => {
                text = text + ' ' + tag
              })
            }
            if (elem.medias && elem.medias.length > 0) {
              elem.medias.forEach((media) => {
                text = text + ' ' + media.description
              })
            }
            return text
          })
          .join()
          .toLowerCase()
        if (
          superMutedWords.length > 0 &&
          superMutedWords.some((supermuteWord) => textOfPosts.includes(supermuteWord))
        ) {
          return false
        }
        // we set the scroll date to the oldest post we got here
        const postDate = new Date(post[post.length - 1].createdAt).getTime()
        this.timestamp = postDate < this.timestamp ? postDate : this.timestamp
        let allFragmentsSeen = true
        const finalPost = post[post.length - 1]
        if (
          finalPost.content === '' &&
          finalPost.medias.length == 0 &&
          finalPost.tags.length == 0 &&
          !finalPost.quotes.length &&
          !finalPost.content_warning &&
          this.postService.usersRewootsDisabled.includes(finalPost.userId)
        ) {
          return false
        }
        post.forEach((component) => {
          const thisFragmentSeen =
            this.viewedPostsIds.includes(component.id) ||
            (component.content === '' && component.tags.length === 0 && component.medias?.length === 0)
          allFragmentsSeen = thisFragmentSeen && allFragmentsSeen
          if (!thisFragmentSeen) {
            this.viewedPostsIds.push(component.id)
          }
        })
        return !allFragmentsSeen
      })
      .map((elem) => elem.sort((a, b) => a.hierarchyLevel - b.hierarchyLevel))

    // internal posts, and stuff could be added here.
    // also some ads for RAID SHADOW LEGENDS. This is a joke.
    // but hey if you dont like it you delete that very easily ;D
    if (!this.jwtService.tokenValid()) {
      this.posts.push([
        {
          hierarchyLevel: 0,
          isRewoot: false,
          quotes: [],
          emojiReactions: [],
          id: '872c9649-5043-460e-a9df-c35a568c8aef',
          content_warning: '',
          markdownContent: '',
          content:
            '<p>To fully enjoy this hellsite, please consider joining us, <a href="/register" rel="noopener noreferrer" target="_blank">register into wafrn!</a></p><p><br></p><p>bring your twisted ideas onto others, share recipies of cake that swap the flour for mayo or hot sauce!</p><p><br></p><p><br></p><p>Consider <a href="/register" rel="noopener noreferrer" target="_blank">joining wafrn</a>!</p>',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: '40472b5b-b668-4156-b795-a60f2986e928',
          user: {
            avatar: '/1641804617334_2f7de58d61c79f0bca67869c5b375f74a3787a17.webp',
            url: 'admin',
            name: 'admin',
            id: 'admin'
          },
          medias: [],
          tags: [],
          notes: 0,
          remotePostId: '',
          privacy: 0,
          userLikesPostRelations: [],
          emojis: [],
          descendents: [],
          bookmarkers: [],
          parentCollection: [],
          canReblog: false,
          canLike: false,
          canQuote: false,
          canReply: false
        }
      ])
    }
    filteredPosts.forEach((post) => {
      this.posts.push(post)
    })
    // if we get a lot of filtered posts, we might want to load the next page
    if (tmpPosts.length > 5 && filteredPosts.length < 5) {
      this.currentPage = this.currentPage + 1
      this.timestamp = this.timestamp - 1
      await this.loadPosts(this.currentPage)
    }
    this.loadingPosts = false
  }
}
