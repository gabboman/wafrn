import { Component, Input } from '@angular/core';
import { AvatarSmallComponent } from '../../avatar-small/avatar-small.component';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PostsService } from 'src/app/services/posts.service';
import { MessageService } from 'src/app/services/message.service';
import { LoginService } from 'src/app/services/login.service';
import { PostActionsComponent } from '../../post-actions/post-actions.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShareNodes, faChevronDown, faHeart, faHeartBroken, faReply, faRepeat, faQuoteLeft, faArrowUpRightFromSquare, faTrash, faClose, faGlobe, faUnlock, faEnvelope, faServer, faUser, faPen } from '@fortawesome/free-solid-svg-icons';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-post-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AvatarSmallComponent,
    PostActionsComponent,
    MatTooltipModule,
    FontAwesomeModule,
    MatButtonModule

  ],
  templateUrl: './post-header.component.html',
  styleUrl: './post-header.component.scss'
})
export class PostHeaderComponent {

  @Input() fragment!: ProcessedPost;
  @Input() simplified: boolean = true;
  userLoggedIn = false;

    // icons
    shareIcon = faShareNodes;
    expandDownIcon = faChevronDown;
    solidHeartIcon = faHeart;
    clearHeartIcon = faHeartBroken;
    reblogIcon = faReply;
    quickReblogIcon = faRepeat;
    quoteIcon = faQuoteLeft;
    shareExternalIcon = faArrowUpRightFromSquare;
    deleteIcon = faTrash;
    closeIcon = faClose;
    worldIcon = faGlobe;
    unlockIcon = faUnlock;
    envelopeIcon = faEnvelope;
    serverIcon = faServer;
    userIcon = faUser;
    editedIcon = faPen;
  constructor(
    public postService: PostsService,
    private messages: MessageService,
    private loginService: LoginService
  ){

    this.userLoggedIn = loginService.checkUserLoggedIn()
  }

  async followUser(id: string) {
    const response = await this.postService.followUser(id);
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: 'You now follow this user!',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary:
          'Something went wrong! Check your internet conectivity and try again',
      });
    }
  }

  async unfollowUser(id: string) {
    const response = await this.postService.unfollowUser(id);
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: 'You no longer follow this user!',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary:
          'Something went wrong! Check your internet conectivity and try again',
      });
    }
  }

}
