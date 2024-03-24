import { Component, Input } from '@angular/core';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { MessageService } from 'src/app/services/message.service';
import { environment } from 'src/environments/environment';
import {
  faArrowUpRightFromSquare,
  faChevronDown,
  faClockRotateLeft,
  faHeart,
  faHeartBroken,
  faRotateLeft,
  faShareNodes,
  faTrash,
  faTriangleExclamation,
  faGlobe,
  faEnvelope,
  faServer,
  faUser,
  faUnlock,
  faPen,
} from '@fortawesome/free-solid-svg-icons';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EditorService } from 'src/app/services/editor.service';
import { LoginService } from 'src/app/services/login.service';
import { CommonModule } from '@angular/common';
import { ReportService } from 'src/app/services/report.service';
import { DeletePostService } from 'src/app/services/delete-post.service';
import { PostsService } from 'src/app/services/posts.service';
@Component({
  selector: 'app-post-actions',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatMenuModule, FontAwesomeModule],
  templateUrl: './post-actions.component.html',
  styleUrl: './post-actions.component.scss',
})
export class PostActionsComponent {
  @Input() content!: ProcessedPost;
  userLoggedIn = false;
  myId: string = 'user-not-logged-in ';
  // icons
  shareIcon = faShareNodes;
  expandDownIcon = faChevronDown;
  solidHeartIcon = faHeart;
  clearHeartIcon = faHeartBroken;
  reblogIcon = faRotateLeft;
  quickReblogIcon = faClockRotateLeft;
  shareExternalIcon = faArrowUpRightFromSquare;
  reportIcon = faTriangleExclamation;
  deleteIcon = faTrash;
  editedIcon = faPen;

  constructor(
    private messages: MessageService,
    private editor: EditorService,
    private postService: PostsService,
    private loginService: LoginService,
    private reportService: ReportService,
    private deletePostService: DeletePostService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn();
    if (this.userLoggedIn) {
      this.myId = loginService.getLoggedUserUUID();
    }
  }

  sharePost() {
    navigator.clipboard.writeText(
      `${environment.frontUrl}/post/${this.content.id}`
    );
    this.messages.add({
      severity: 'success',
      summary: 'The woot URL was copied to your clipboard!',
    });
  }

  shareOriginalPost() {
    navigator.clipboard.writeText(this.content.remotePostId);
    this.messages.add({
      severity: 'success',
      summary: 'The woot original URL was copied to your clipboard!',
    });
  }

  async quickReblog() {
    const response = await this.editor.createPost({
      content: '',
      idPostToReblog: this.content.id,
      privacy: 0,
      media: [],
    });
    if (response) {
      this.messages.add({
        severity: 'success',
        summary: 'You reblogged the woot succesfully',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary:
          'Something went wrong! Check your internet conectivity and try again',
      });
    }
  }

  replyPost() {
    this.editor.replyPost(this.content);
  }
  async unlikePost() {
    if (await this.postService.unlikePost(this.content.id)) {
      this.content.userLikesPostRelations =
        this.content.userLikesPostRelations.filter((elem) => elem != this.myId);
      this.messages.add({
        severity: 'success',
        summary: 'You successfully unliked this woot',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again',
      });
    }
  }
  async likePost() {
    if (await this.postService.likePost(this.content.id)) {
      this.content.userLikesPostRelations.push(this.myId);
      this.messages.add({
        severity: 'success',
        summary: 'You successfully liked this woot',
      });
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong. Please try again',
      });
    }
  }
  reportPost() {
    this.reportService.openReportPostDialog(this.content);
  }
  editPost() {
    this.editor.replyPost(this.content, true);
  }
  deletePost() {
    this.deletePostService.openDeletePostDialog(this.content.id);
  }
}
