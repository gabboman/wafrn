import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faServer, faUser, faUserSlash, faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { BlogDetails } from 'src/app/interfaces/blogDetails';
import { BlocksService } from 'src/app/services/blocks.service';
import { LoginService } from 'src/app/services/login.service';
import { MessageService } from 'src/app/services/message.service';
import { PostsService } from 'src/app/services/posts.service';
import { environment } from 'src/environments/environment';
import { AskDialogContentComponent } from '../ask-dialog-content/ask-dialog-content.component';

@Component({
  selector: 'app-blog-header',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    FontAwesomeModule,
    MatMenuModule,
    MatButtonModule,
    RouterModule,
  ],
  templateUrl: './blog-header.component.html',
  styleUrl: './blog-header.component.scss'
})
export class BlogHeaderComponent implements OnChanges, OnDestroy {
  @Input() blogDetails!: BlogDetails;
  avatarUrl = '';
  headerUrl = '';
  userLoggedIn = false;
  updateFollowersSubscription;
  followedUsers: string[] = [];;
  notYetAcceptedFollows: string[] = [];;
  fediAttachment: { name: string, value: string }[] = []
  expandDownIcon = faChevronDown;
  muteUserIcon = faVolumeMute;
  unmuteUserIcon = faVolumeUp;
  userIcon = faUser;
  blockUserIcon = faUserSlash;
  unblockServerIcon = faServer;
  allowAsk = false;



  constructor(
    private loginService: LoginService,
    private postService: PostsService,
    private messages: MessageService,
    public blockService: BlocksService,
    public dialogService: MatDialog

  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();
    this.updateFollowersSubscription = this.postService.updateFollowers.subscribe(() => {
      this.followedUsers = this.postService.followedUserIds;
      this.notYetAcceptedFollows =
        this.postService.notYetAcceptedFollowedUsersIds;
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.blogDetails) {
      this.avatarUrl = this.blogDetails.url.startsWith('@')
        ? environment.externalCacheurl +
        encodeURIComponent(this.blogDetails.avatar)
        : environment.externalCacheurl +
        encodeURIComponent(
          environment.baseMediaUrl + this.blogDetails.avatar
        );
      this.headerUrl = this.blogDetails.url.startsWith('@')
        ? environment.externalCacheurl +
        encodeURIComponent(this.blogDetails.headerImage)
        : environment.externalCacheurl +
        encodeURIComponent(
          environment.baseMediaUrl + this.blogDetails.headerImage
        );
      const askLevelOption = this.blogDetails.publicOptions.find(elem => elem.optionName == "wafrn.public.asks")
      let askLevel = askLevelOption ? parseInt(askLevelOption.optionValue) : 2;
      if (this.blogDetails.url.startsWith('@')) {
        askLevel = 3
      }
      this.allowAsk = this.loginService.checkUserLoggedIn() ? [1, 2].includes(askLevel) : askLevel == 1;
      this.allowAsk = this.allowAsk && this.loginService.getLoggedUserUUID() != this.blogDetails.id;
      this.allowAsk = true;
      const fediAttachment = this.blogDetails.publicOptions.find(elem => elem.optionName == "fediverse.public.attachment")
      if (fediAttachment) {
        this.fediAttachment = JSON.parse(fediAttachment.optionValue)
      }

    }
  }


  ngOnDestroy(): void {
    this.updateFollowersSubscription.unsubscribe();
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

  async getAskDialogComponent(): Promise<typeof AskDialogContentComponent> {
    const { AskDialogContentComponent } = await import(
      '../ask-dialog-content/ask-dialog-content.component'
    );
    return AskDialogContentComponent;
  }


  async openAskDialog() {
    this.dialogService.open(await this.getAskDialogComponent(), {
      data: { details: this.blogDetails },
      width: '100%',
    });
  }
}
