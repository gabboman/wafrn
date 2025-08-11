import { CommonModule } from '@angular/common'
import { Component, computed, input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDialog } from '@angular/material/dialog'
import { MatMenuModule } from '@angular/material/menu'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import {
  faChevronDown,
  faServer,
  faUser,
  faUserSlash,
  faVolumeMute,
  faVolumeUp,
  faUsers,
  faTriangleExclamation,
  faRepeat,
  faQuoteRight
} from '@fortawesome/free-solid-svg-icons'
import { BlogDetails } from 'src/app/interfaces/blogDetails'
import { BlocksService } from 'src/app/services/blocks.service'
import { LoginService } from 'src/app/services/login.service'
import { MessageService } from 'src/app/services/message.service'
import { PostsService } from 'src/app/services/posts.service'
import { MatTooltipModule } from '@angular/material/tooltip'
import { EnvironmentService } from 'src/app/services/environment.service'
import { InfoCardComponent } from '../info-card/info-card.component'
import { faBluesky } from '@fortawesome/free-brands-svg-icons'
import { ReportService } from 'src/app/services/report.service'

@Component({
  selector: 'app-blog-header',
  imports: [
    CommonModule,
    MatCardModule,
    FontAwesomeModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    RouterModule,
    InfoCardComponent
  ],
  templateUrl: './blog-header.component.html',
  styleUrl: './blog-header.component.scss'
})
export class BlogHeaderComponent implements OnChanges, OnDestroy {
  parser = new DOMParser()
  blogDetails = input.required<BlogDetails>()
  avatarUrl = computed<string>(() => {
    return this.blogDetails().url.startsWith('@')
      ? EnvironmentService.environment.externalCacheurl + encodeURIComponent(this.blogDetails().avatar)
      : EnvironmentService.environment.externalCacheurl +
          encodeURIComponent(EnvironmentService.environment.baseMediaUrl + this.blogDetails().avatar)
  })
  headerUrl = ''
  userLoggedIn = false
  isMe = false
  expandDownIcon = faChevronDown
  muteUserIcon = faVolumeMute
  unmuteUserIcon = faVolumeUp
  reportUserIcon = faTriangleExclamation
  disableRewootIcon = faRepeat
  disableQuotesIcon = faQuoteRight

  userIcon = faUser
  bskyIcon = faBluesky
  usersIcon = faUsers
  blockUserIcon = faUserSlash
  unblockServerIcon = faServer
  allowAsk = false
  allowRemoteAsk = false
  isBlueskyUser = false
  headerHTML = ''

  fediComp = computed<{ name: string; value: string }[]>(() => {
    const fediAttachment = this.blogDetails().publicOptions.find(
      (elem) => elem.optionName == 'fediverse.public.attachment'
    )
    if (fediAttachment) {
      return JSON.parse(fediAttachment.optionValue)
    }
    return []
  })

  constructor(
    private loginService: LoginService,
    public postService: PostsService,
    private messages: MessageService,
    public blockService: BlocksService,
    public dialogService: MatDialog,
    public activatedRoute: ActivatedRoute,
    public environmentService: EnvironmentService,
    public reportService: ReportService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn()
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.blogDetails) {
      this.headerUrl = this.blogDetails().url.startsWith('@')
        ? EnvironmentService.environment.externalCacheurl + encodeURIComponent(this.blogDetails().headerImage)
        : EnvironmentService.environment.externalCacheurl +
          encodeURIComponent(EnvironmentService.environment.baseMediaUrl + this.blogDetails().headerImage)
      const askLevelOption = this.blogDetails().publicOptions.find((elem) => elem.optionName == 'wafrn.public.asks')
      let askLevel = askLevelOption ? parseInt(askLevelOption.optionValue) : 2
      if (this.blogDetails().url.startsWith('@')) {
        askLevel = 3
      }
      this.allowAsk = this.loginService.checkUserLoggedIn() ? [1, 2].includes(askLevel) : askLevel == 1
      this.allowAsk = this.allowAsk && this.loginService.getLoggedUserUUID() != this.blogDetails().id
      this.allowRemoteAsk = askLevel != 3 && this.loginService.getLoggedUserUUID() != this.blogDetails().id
      this.isMe = this.blogDetails().id == this.loginService.getLoggedUserUUID()
      let path = this.activatedRoute.snapshot.routeConfig?.path
      if (path && this.allowAsk && path.toLowerCase().endsWith('/ask')) {
        this.openAskDialog()
      }
      const parsedAsHTML = this.parser.parseFromString(this.blogDetails().description, 'text/html')
      const imgs = parsedAsHTML.getElementsByTagName('img')
      Array.from(imgs).forEach((img, index) => {
        if (!img.src.startsWith(EnvironmentService.environment.externalCacheurl)) {
          img.src = EnvironmentService.environment.externalCacheurl + encodeURIComponent(img.src)
        }
      })
      this.headerHTML = parsedAsHTML.documentElement.innerHTML
    }
  }

  ngOnDestroy(): void {}

  async unfollowUser(id: string) {
    const response = await this.postService.unfollowUser(id)
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: 'You no longer follow this user!'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong! Check your internet connectivity and try again'
      })
    }
  }

  async followUser(id: string) {
    const response = await this.postService.followUser(id)
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: 'You now follow this user!',
        soundUrl: '/assets/sounds/5.ogg'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong! Check your internet connectivity and try again'
      })
    }
  }

  async getAskDialogComponent(): Promise<typeof AskDialogContentComponent> {
    const { AskDialogContentComponent } = await import('../ask-dialog-content/ask-dialog-content.component')
    return AskDialogContentComponent
  }

  async openAskDialog() {
    this.dialogService.open(await this.getAskDialogComponent(), {
      data: { details: this.blogDetails() },
      width: '800px'
    })
  }

  formatBigNumber(n: number) {
    if (n < 10000) {
      return n
    }

    return Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(n)
  }

  async updateDisableRewoots() {
    await this.postService.updateDisableRewoots(this.blogDetails().id)
  }

  async updateDisableQuotes() {
    await this.postService.updateDisableQuotes(this.blogDetails().id)
  }
}
