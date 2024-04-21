import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { EditorService } from 'src/app/services/editor.service';
import { MediaService } from 'src/app/services/media.service';
import { environment } from 'src/environments/environment';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import 'quill-mention-wafrn';
import Quill from 'quill';
import { JwtService } from 'src/app/services/jwt.service';
import { WafrnMedia } from 'src/app/interfaces/wafrn-media';
import { DashboardService } from 'src/app/services/dashboard.service';
import { MessageService } from 'src/app/services/message.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { MediaPreviewComponent } from '../media-preview/media-preview.component';
import { LoginService } from 'src/app/services/login.service';
import {
  faEnvelope,
  faGlobe,
  faServer,
  faUnlock,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PostFragmentComponent } from '../post-fragment/post-fragment.component';

@Component({
  selector: 'app-post-editor',
  templateUrl: './post-editor.component.html',
  styleUrls: ['./post-editor.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    QuillModule,
    FormsModule,
    ReactiveFormsModule,
    MediaPreviewComponent,
    MatDialogContent,
    MatButtonModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    FileUploadComponent,
    FontAwesomeModule,
    PostFragmentComponent
  ],
  providers: [EditorService],
})
export class PostEditorComponent implements OnInit {
  privacyOptions = [
    { level: 0, name: 'Public', icon: faGlobe },
    { level: 1, name: 'Followers only', icon: faUser },
    { level: 2, name: 'This instance only', icon: faServer },
    { level: 3, name: 'Unlisted', icon: faUnlock },
    { level: 10, name: 'Direct Message', icon: faEnvelope },
  ];

  showContentWarning = false;
  displayMarqueeButton = false;
  postCreatorContent: string = '';
  initialContent = '';
  tags: string = '';
  privacy: number;

  get privacyOption() {
    return this.privacyOptions.find((elem) => elem.level === this.privacy);
  }

  @ViewChild(QuillEditorComponent, { static: true })
  quill!: QuillEditorComponent;

  // upload media variables
  newImageFile: File | undefined;
  disableImageUploadButton = false;
  uploadedMedias: WafrnMedia[] = [];

  // add mention variables
  @ViewChild('mentionUserSearchPanel') mentionUserSearchPanel: any;

  editing = false;
  baseMediaUrl = environment.baseMediaUrl;
  cacheurl = environment.externalCacheurl;
  userSelectionMentionValue = '';
  contentWarning = '';
  enablePrivacyEdition = true;

  modules = {
    mention: {
      allowedChars: /^[A-Z0-9a-z_.@-]*$/,
      mentionDenotationChars: ['@'],
      maxChars: 128,
      minChars: 3,
      positioningStrategy: 'fixed',
      linkTarget: '_self',
      fixMentionsToQuill: false,
      isolateCharacter: true,
      allowInlineMentionChar: true,
      defaultMenuOrientation: 'bottom',
      dataAttributes: ['id', 'value', 'avatar', 'link'],
      renderItem: (item: any, searchTerm: any) => {
        const div = document.createElement('div');
        div.className = 'quill-mention-inner';

        const imgWrapper = document.createElement('div');
        div.appendChild(imgWrapper);

        const img = document.createElement('img');
        img.src = item.avatar;
        imgWrapper.appendChild(img);

        const span = document.createElement('span');
        span.innerHTML = item.value;
        div.appendChild(span);

        return div;
      },
      source: async (searchTerm: string, renderList: any) => {
        let matches = await this.updateMentionsSuggestions(searchTerm);
        if (searchTerm.length > 0) {
          matches = matches.filter(
            (m) =>
              m.value.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
          );
        }
        renderList(matches, searchTerm);
      },
    },
    toolbar: [],
  };

  // TODO fill with custom formating. no clue yet
  customOptions = [];

  maxFileUploadSize = parseInt(environment.maxUploadSize) * 1024 * 1024;

  get idPostToReblog() {
    return this.data?.post?.id;
  }

  constructor(
    private editorService: EditorService,
    private messages: MessageService,
    private mediaService: MediaService,
    private jwtService: JwtService,
    private dashboardService: DashboardService,
    private dialogRef: MatDialogRef<PostEditorComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { post?: ProcessedPost; edit?: boolean },
    private loginService: LoginService
  ) {
    this.privacy = this.loginService.getUserDefaultPostPrivacyLevel();
  }

  ngOnInit(): void {
    this.editing = this.data?.edit === true;

    let content = '';
    const post = this.data?.post;
    if (post) {
      this.contentWarning = post.content_warning;

      if (this.data.edit) {
        if (post.content) {
          content = post.content;
        }
        this.tags = post.tags.map((tag) => tag.tagName).join(', ');
        this.uploadedMedias = post.medias ? post.medias : [];
      }

      this.privacy = (
        this.privacyOptions.find((elem) => elem.level === post.privacy) ||
        this.privacyOptions[0]
      ).level;

      if (this.privacy !== 0) {
        this.enablePrivacyEdition = false;
      }
    }

    if (!content) {
      content = this.getInitialMentionsHTML();
    }

    this.openEditor(content);
  }

  getInitialMentionsHTML() {
    const usersToMention: { id: string; url: string; remoteId: string }[] = [];
    const post = this.data?.post;
    if (!post) {
      return '';
    }

    const currentUserId = this.jwtService.getTokenData().userId;
    if (post.userId !== currentUserId) {
      usersToMention.push({
        id: post.user.id,
        url: post.user.url.startsWith('@')
          ? post.user.url
          : '@' + post.user.url,
        remoteId: post.user.remoteId
          ? post.user.remoteId
          : `${environment.frontUrl}/blog/${post.user.url}`,
      });
    }

    post.mentionPost?.forEach((mention) => {
      if (
        mention.id !== currentUserId &&
        !usersToMention.some((elem) => elem.id === mention.id)
      ) {
        usersToMention.push({
          url: mention.url.startsWith('@') ? mention.url : '@' + mention.url,
          id: mention.id,
          remoteId: mention.remoteId
            ? mention.remoteId
            : `${environment.frontUrl}/blog/${mention.url}`,
        });
      }
    });

    const mentionsHtml = usersToMention
      .map((u) => this.getMentionHtml(u))
      .join('<span>&nbsp;</span>');

    return mentionsHtml;
  }

  openEditor(content?: string) {
    this.postCreatorContent = content ? `${content}<span>&nbsp;</span>` : '';
    this.initialContent = this.postCreatorContent;

    /*
    const blockBlot = Quill.import('blots/block');
    class MarqueeBlot extends blockBlot {
      static create(value: any) {
        const node = super.create(value);

        return node;
      }
    }
    MarqueeBlot['blotName'] = 'marquee';
    MarqueeBlot['tagName'] = 'marquee';

    Quill.register('formats/marquee', MarqueeBlot);
    setTimeout(() => {
      this.displayMarqueeButton = true;
    });
    */

    // quill format variables
    const italic: any = Quill.import('formats/italic');
    italic.tagName = 'i'; // Quill uses <em> by default
    Quill.register(italic, true);

    const strike: any = Quill.import('formats/strike');
    strike.tagName = 'del'; // Quill uses <s> by default
    Quill.register(strike, true);

    // custom formatting for mentions inserted in the editor
    const mentionBlot: any = Quill.import('blots/mention');

    mentionBlot.setDataValues = (
      node: HTMLElement,
      data: { id: string; value: string; link: string }
    ) => {
      if (!data.id) {
        return document.createElement('span');
      }

      const newNode = node.cloneNode(false) as HTMLElement;
      newNode.innerHTML = this.getMentionHtml({
        id: data.id,
        url: data.value,
        remoteId: data.link,
      }).trim();
      return newNode.firstElementChild;
    };
    mentionBlot.tagName = 'a'; // used to be a <span> and masto peps want me dead!
    Quill.register(mentionBlot, true);

    this.quill.ngOnInit();
  }

  postBeingSubmitted = false;
  async submitPost() {
    this.postBeingSubmitted = true;
    let tagsToSend = '';
    this.tags
      .split(',')
      .map((elem) => elem.trim())
      .filter((t) => t !== '')
      .forEach((elem) => {
        tagsToSend = `${tagsToSend}${elem.trim()},`;
      });
    tagsToSend = tagsToSend.slice(0, -1);
    let res = undefined;
    res = await this.editorService.createPost({
      content: this.postCreatorContent ? this.postCreatorContent : '',
      media: this.uploadedMedias,
      privacy: this.privacy,
      tags: tagsToSend,
      idPostToReblog: this.editing ? undefined : this.idPostToReblog,
      contentWarning: this.contentWarning,
      idPostToEdit: this.editing ? this.idPostToReblog : undefined,
    });
    // its a great time to check notifications isnt it?
    this.dashboardService.scrollEventEmitter.emit('post');
    if (res) {
      this.messages.add({
        severity: 'success',
        summary: 'Your woot has been published!',
      });
      this.postCreatorContent = '';
      this.uploadedMedias = [];
      this.tags = '';
      this.dialogRef.close();
    } else {
      this.messages.add({
        severity: 'warn',
        summary:
          'Something went wrong and your woot was not published. Check your internet connection and try again',
      });
    }
    this.postBeingSubmitted = false;
  }

  closeEditor() {
    this.dialogRef.close();
  }

  imgSelected(ev: InputEvent) {
    const target = ev.target as HTMLInputElement;
    const files = target.files || [];
    if (files[0]) {
      this.newImageFile = files[0];
    }
  }

  async uploadImage(media: WafrnMedia) {
    try {
      media.url = environment.baseMediaUrl + media.url;
      this.uploadedMedias.push(media);
      this.messages.add({
        severity: 'success',
        summary:
          'Media uploaded and added to the woot! Please fill in the description',
      });
    } catch (error) {
      console.error(error);
      this.messages.add({
        severity: 'error',
        summary: 'Oh no! something went wrong',
      });
    }
    this.disableImageUploadButton = false;
  }

  uploadImageFailed() {
    this.messages.add({
      severity: 'error',
      summary: 'Image upload failed! Please send us details',
    });
  }

  async updateMentionsSuggestions(
    query: string
  ): Promise<
    { id: string; value: string; avatar: string; remoteId: string }[]
  > {
    if (!query) {
      return [];
    }

    const backendResponse: any = await this.editorService.searchUser(query);
    if (!backendResponse) {
      return [];
    }

    return (backendResponse.users || []).map((user: any) => {
      user.avatar = user.url.startsWith('@')
        ? this.cacheurl + encodeURIComponent(user.avatar)
        : this.cacheurl + encodeURIComponent(this.baseMediaUrl + user.avatar);

      if (!user.remoteId) {
        user.remoteId = `${environment.frontUrl}/blog/${user.url}`;
      }

      let url = user.url;
      url = url.startsWith('@') ? url.substring(1) : url;
      return {
        id: user.id,
        value: url,
        avatar: user.avatar,
        link: user.remoteId
          ? user.remoteId
          : `${user.frontUrl}/blog/${user.url}`,
      };
    });
  }

  adultContentUpdated(index: number) {
    this.uploadedMedias[index].NSFW = this.uploadedMedias[index].adultContent
      ? true
      : this.uploadedMedias[index].NSFW;
  }

  allDescriptionsFilled(): boolean {
    const disableCheck = localStorage.getItem('disableForceAltText') === 'true';
    return disableCheck || this.uploadedMedias.every((med) => med.description);
  }

  getMentionHtml(mention: {
    id: string;
    url: string;
    remoteId: string;
  }): string {
    const mentionHtml = `<a
      href="${mention.remoteId}"
      class="u-url h-card mention"
      data-id="${mention.id}"
      data-value="${mention.url}"
      data-link="${mention.remoteId}"
    >${mention.url.startsWith('@') ? mention.url : '@' + mention.url}</a>`;
    return mentionHtml;
  }

  deleteImage(index: number) {
    // TODO we should look how to clean the disk at some point. A call to delete the media would be nice
    this.uploadedMedias.splice(index, 1);
  }
}
