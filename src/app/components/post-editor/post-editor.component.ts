import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { EditorService } from 'src/app/services/editor.service';
import { MediaService } from 'src/app/services/media.service';
import { environment } from 'src/environments/environment';
import { QuillEditorComponent } from 'ngx-quill';
import 'quill-mention';
import { JwtService } from 'src/app/services/jwt.service';
import { WafrnMedia } from 'src/app/interfaces/wafrn-media';
import { DashboardService } from 'src/app/services/dashboard.service';
import { MessageService } from 'src/app/services/message.service';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { MediaPreviewComponent } from '../media-preview/media-preview.component';
import Quill from 'quill';
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
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    FileUploadComponent,
  ],
  providers: [EditorService],
})
export class PostEditorComponent implements OnInit {
  privacyOptions = [
    { level: 0, name: 'Public' },
    { level: 1, name: 'Followers only' },
    { level: 2, name: 'This instance only' },
    { level: 3, name: 'Unlisted' },
    { level: 10, name: 'Direct Message' },
  ];
  displayMarqueeButton = false;
  idPostToReblog: string | undefined;
  editorVisible: boolean = false;
  postCreatorContent: string = '';
  tags: string = '';
  privacy = 0;
  @ViewChild('quill') quill!: QuillEditorComponent;
  // upload media variables
  newImageFile: File | undefined;
  disableImageUploadButton = false;
  uploadedMedias: WafrnMedia[] = [];

  // add mention variables
  @ViewChild('mentionUserSearchPanel') mentionUserSearchPanel: any;
  mentionSuggestions: any[] = [];
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
      linkTarget: '_self',
      fixMentionsToQuill: true,
      isolateCharacter: true,
      allowInlineMentionChar: true,
      //defaultMenuOrientation: 'bottom',
      renderItem: (item: any, searchTerm: any) => {
        const itemString = `<div><img src="${item.avatar}" style="max-height: 24px; max-width: 24px;" /> ${item.value}</div>`;
        return new DOMParser().parseFromString(itemString, 'text/html').body
          .childNodes[0];
      },
      source: async (searchTerm: string, renderList: any) => {
        await this.updateMentionsSuggestions(searchTerm);
        const values = this.mentionSuggestions.map((elem) => {
          let url = elem.url;
          url = url.startsWith('@') ? url.substring(1) : url;
          return {
            id: elem.id,
            value: url,
            avatar: elem.avatar,
            remoteId: elem.remoteId
              ? elem.remoteId
              : `${elem.frontUrl}/blog/${elem.url}`,
          };
        });

        if (searchTerm.length === 0) {
          renderList(values, searchTerm);
        } else {
          const matches: any = [];

          values.forEach((entry) => {
            if (
              entry.value.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
            ) {
              matches.push(entry);
            }
          });
          renderList(matches, searchTerm);
        }
      },
    },
    toolbar: [],
  };

  // TODO fill with custom formating. no clue yet
  customOptions = [];

  maxFileUploadSize = parseInt(environment.maxUploadSize) * 1024 * 1024;

  constructor(
    private editorService: EditorService,
    private messages: MessageService,
    private mediaService: MediaService,
    private jwtService: JwtService,
    private dashboardService: DashboardService,
    private dialogRef: MatDialogRef<PostEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { post?: ProcessedPost }
  ) {}

  ngOnInit(): void {
    this.privacy = this.privacyOptions[0].level;

    this.enablePrivacyEdition = true;
    this.privacy = this.privacyOptions[0].level;
    this.contentWarning = '';
    this.idPostToReblog = this.data?.post?.id;
    const inResponseTo = this.data?.post;
    this.postCreatorContent = '';
    this.uploadedMedias = [];
    this.tags = '';
    const usersToMention: { id: string; url: string; remoteId: string }[] = [];
    if (inResponseTo) {
      this.contentWarning = inResponseTo.content_warning;
      const parentPrivacy = this.privacyOptions.find(
        (elem) => elem.level === inResponseTo.privacy
      );
      if (parentPrivacy?.level !== 0) {
        this.enablePrivacyEdition = false;
      }
      this.privacy = parentPrivacy
        ? parentPrivacy.level
        : this.privacyOptions[0].level;
      if (inResponseTo.userId != this.jwtService.getTokenData().userId) {
        usersToMention.push({
          id: inResponseTo.user.id,
          url: inResponseTo.user.url.startsWith('@')
            ? inResponseTo.user.url
            : '@' + inResponseTo.user.url,
          remoteId: inResponseTo.user.remoteId
            ? inResponseTo.user.remoteId
            : `${environment.frontUrl}/blog/${inResponseTo.user.url}`,
        });
      }
      inResponseTo.mentionPost?.forEach((mention) => {
        if (
          !usersToMention.map((elem) => elem.id).includes(mention.id) &&
          mention.id != this.jwtService.getTokenData().userId
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
    }
    let mentionsHtml = '';
    usersToMention.forEach((elem) => {
      mentionsHtml = mentionsHtml + this.getMentionHtml(elem);
    });
    if (mentionsHtml !== '') {
      mentionsHtml = mentionsHtml + '<span> </span>';
    }
    this.openEditor();

    this.openEditor(mentionsHtml);
  }

  openEditor(content?: string) {
    this.postCreatorContent = '';
    this.uploadedMedias = [];
    // TODO FIX HACK. We just add a timeout so some stuff gets initialized
    // I would try doing that now but cant
    setTimeout(() => {
      // quill format variables
      const italic = Quill.import('formats/italic');
      italic.tagName = 'i'; // Quill uses <em> by default
      Quill.register(italic, true);
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
      const strike = Quill.import('formats/strike');
      strike.tagName = 'del'; // Quill uses <s> by default
      Quill.register(strike, true);

      const mentionBlot = Quill.import('blots/mention');

      mentionBlot.setDataValues = (node: any, data: any) => {
        const newNode: any = node.cloneNode(false);
        const userMentionFullData = this.mentionSuggestions.find(
          (elem) => elem.id === data.id
        );
        newNode.innerHTML = this.getMentionHtml({
          id: data.id,
          url: data.value,
          remoteId: data.remoteid
            ? data.remoteid
            : userMentionFullData.remoteId,
        });
        return newNode;
      };
      mentionBlot.tagName = 'a'; // used to be a <span> and masto peps want me dead!
      Quill.register(mentionBlot, true);

      // quill stuff
      this.quill.ngOnInit();
      this.editorVisible = true;
      if (content) {
        this.quill.quillEditor.clipboard.dangerouslyPasteHTML(content);
        this.quill.quillEditor.insertText(
          this.quill.quillEditor.getLength() - 1,
          '',
          'user'
        );
      }
    });
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
    let mediasString = '';
    // this.fixNullPosting();
    if (this.uploadedMedias.length > 0) {
      const updateMediaPromises: Promise<any>[] = [];
      this.uploadedMedias.forEach((elem) => {
        updateMediaPromises.push(
          this.mediaService.updateMedia(
            elem.id,
            elem.description,
            elem.NSFW,
            elem.adultContent
          )
        );
        mediasString = `${mediasString}[wafrnmediaid="${elem.id}"]`;
      });
      await Promise.allSettled(updateMediaPromises);
    }
    res = await this.editorService.createPost(
      (this.postCreatorContent ? this.postCreatorContent : '') + mediasString,
      this.privacy,
      tagsToSend,
      this.idPostToReblog,
      this.contentWarning
    );
    // its a great time to check notifications isnt it?
    this.dashboardService.scrollEventEmitter.emit('post');
    if (res) {
      this.messages.add({
        severity: 'success',
        summary: 'Your post has been published!',
      });
      this.postCreatorContent = '';
      this.uploadedMedias = [];
      this.tags = '';
      this.dialogRef.close();
    } else {
      this.messages.add({
        severity: 'warn',
        summary:
          'Something went wrong and your post was not published. Check your internet connection and try again',
      });
    }
    this.postBeingSubmitted = false;
  }

  closeEditor() {
    this.dialogRef.close();
  }

  fixNullPosting() {
    if (!this.postCreatorContent) {
      this.postCreatorContent = '';
      this.uploadedMedias = [];
    }
  }

  imgSelected(filePickerEvent: any) {
    if (filePickerEvent.target.files[0]) {
      this.newImageFile = filePickerEvent.target.files[0];
    }
  }

  async uploadImage(media: WafrnMedia) {
    try {
      media.url = environment.baseMediaUrl + media.url;
      this.uploadedMedias.push(media);
      this.messages.add({
        severity: 'success',
        summary:
          'Media uploaded and added to the post! Please fill in the description',
      });
    } catch (error) {
      console.log(error);
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

  async updateMentionsSuggestions(query: string) {
    if (query) {
      const backendResponse: any = await this.editorService.searchUser(query);
      if (backendResponse) {
        this.mentionSuggestions = backendResponse.users
          ? backendResponse.users
          : [];
        this.mentionSuggestions = this.mentionSuggestions.map((user) => {
          user.avatar = user.url.startsWith('@')
            ? this.cacheurl + encodeURIComponent(user.avatar)
            : this.baseMediaUrl + user.avatar;
          user.remoteId = user.remoteId
            ? user.remoteId
            : `${environment.frontUrl}/blog/${user.url}`;
          return user;
        });
      }
    } else {
      this.mentionSuggestions = [];
    }
  }

  mentionUserSelected(selected: any) {
    this.postCreatorContent = `${this.postCreatorContent}[mentionuserid="${selected.id}"]`;
    this.userSelectionMentionValue = '';
    this.mentionUserSearchPanel.hide();
  }

  adultContentUpdated(index: number) {
    this.uploadedMedias[index].NSFW = this.uploadedMedias[index].adultContent
      ? true
      : this.uploadedMedias[index].NSFW;
  }

  getMentionHtml(mention: {
    id: string;
    url: string;
    remoteId: string;
  }): string {
    const mentionHtml = `<a href="${
      mention.remoteId
    }" class="u-url h-card mention" data-id="${mention.id}" data-value="${
      mention.url
    }" data-remoteid="${mention.remoteId}" >${
      mention.url.startsWith('@') ? mention.url : '@' + mention.url
    }</a>`;
    return mentionHtml;
  }

  deleteImage(index: number) {
    // TODO we should look how to clean the disk at some point. A call to delete the media would be nice
    this.uploadedMedias.splice(index, 1);
  }
}
