import { Component, Input, OnChanges, SimpleChanges, input } from '@angular/core'
import { AvatarSmallComponent } from '../../avatar-small/avatar-small.component'
import { ProcessedPost } from '../../../interfaces/processed-post'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { PostsService } from '../../../services/posts.service'
import { MessageService } from '../../../services/message.service'
import { LoginService } from '../../../services/login.service'
import { PostActionsComponent } from '../../post-actions/post-actions.component'
import { MatTooltipModule } from '@angular/material/tooltip'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import {
  faShareNodes,
  faChevronDown,
  faHeart,
  faHeartBroken,
  faReply,
  faRepeat,
  faQuoteLeft,
  faArrowUpRightFromSquare,
  faTrash,
  faClose,
  faGlobe,
  faUnlock,
  faEnvelope,
  faServer,
  faUser,
  faPen
} from '@fortawesome/free-solid-svg-icons'
import { MatButtonModule } from '@angular/material/button'
import { DateTime } from 'luxon'

@Component({
  selector: 'app-post-header',
  imports: [
    CommonModule,
    RouterModule,
    AvatarSmallComponent,
    PostActionsComponent,
    MatTooltipModule,
    FontAwesomeModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './post-header.component.html',
  styleUrl: './post-header.component.scss'
})
export class PostHeaderComponent implements OnChanges {
  @Input() fragment!: ProcessedPost
  readonly simplified = input<boolean>(true);
  readonly disableLink = input<boolean>(false);
  readonly headerText = input<string>('');
  userLoggedIn = false

  // table for the icons. ATTENTION, PRIVACY 10 IS SET ON CONSTRUCTOR
  privacyOptions = [
    { level: 0, name: 'Public', icon: faGlobe },
    { level: 1, name: 'Followers only', icon: faUser },
    { level: 2, name: 'This instance only', icon: faServer },
    { level: 3, name: 'Unlisted', icon: faUnlock }
  ]

  // icons
  shareIcon = faShareNodes
  expandDownIcon = faChevronDown
  solidHeartIcon = faHeart
  clearHeartIcon = faHeartBroken
  reblogIcon = faReply
  quickReblogIcon = faRepeat
  quoteIcon = faQuoteLeft
  shareExternalIcon = faArrowUpRightFromSquare
  deleteIcon = faTrash
  closeIcon = faClose
  worldIcon = faGlobe
  unlockIcon = faUnlock
  envelopeIcon = faEnvelope
  serverIcon = faServer
  userIcon = faUser
  editedIcon = faPen
  edited = false

  timeAgo = ''

  constructor(
    public postService: PostsService,
    private messages: MessageService,
    private loginService: LoginService
  ) {
    // its an array
    ;(this.privacyOptions[10] = { level: 10, name: 'Direct Message', icon: faEnvelope }),
      (this.userLoggedIn = loginService.checkUserLoggedIn())
  }
  ngOnChanges(changes: SimpleChanges): void {
    const relative = DateTime.fromJSDate(this.fragment.createdAt).setLocale('en').toRelative()
    this.timeAgo = relative ? relative : 'Error with date'
    this.edited = this.fragment.updatedAt.getTime() - this.fragment.createdAt.getTime() > 6000
  }

  async followUser(id: string) {
    const response = await this.postService.followUser(id)
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: 'You now follow this user!'
      })
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong! Check your internet conectivity and try again'
      })
    }
  }

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
        summary: 'Something went wrong! Check your internet conectivity and try again'
      })
    }
  }
}
