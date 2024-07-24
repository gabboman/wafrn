import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { MediaPreviewComponent } from '../media-preview/media-preview.component';
import { LoginService } from 'src/app/services/login.service';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  IconDefinition,
  faClose,
  faEnvelope,
  faGlobe,
  faQuoteLeft,
  faServer,
  faUnlock,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PostFragmentComponent } from '../post-fragment/post-fragment.component';
import { PostsService } from 'src/app/services/posts.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { EmojiCollectionsComponent } from '../emoji-collections/emoji-collections.component';
import { Subscription } from 'rxjs';
import { EmojiCollection } from 'src/app/interfaces/emoji-collection';
import { Emoji } from 'src/app/interfaces/emoji';
import { QuestionPollQuestion } from 'src/app/interfaces/questionPoll';
import { MatMenuModule } from '@angular/material/menu';

type Mention = {
  id: string;
  value: string;
  avatar: string;
  remoteId: string;
  url: string;
  type: 'mention' | 'emoji';
};

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
    FontAwesomeModule,
    PostFragmentComponent,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatCardModule,
    EmojiCollectionsComponent,
    MatMenuModule
  ],
  providers: [EditorService],
})
export class PostEditorComponent implements OnInit, OnDestroy {
  privacyOptions = [
    { level: 0, name: 'Public', icon: faGlobe },
    { level: 1, name: 'Followers only', icon: faUser },
    { level: 2, name: 'This instance only', icon: faServer },
    { level: 3, name: 'Unlisted', icon: faUnlock },
    { level: 10, name: 'Direct Message', icon: faEnvelope },
  ];

  closeIcon = faClose;
  quoteIcon = faQuoteLeft;
  quoteOpen = false;

  showContentWarning = false;
  displayMarqueeButton = false;
  postCreatorContent: string = '';
  initialContent = '';
  tags: string = '';
  privacy: number;
  urlPostToQuote: string = '';
  quoteLoading = false;

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
  pollQuestions: QuestionPollQuestion[] = []

  modules = {
    mention: {
      allowedChars: /^[A-Z0-9a-z_.@-]*$/,
      mentionDenotationChars: ['@', ':'], // we will add : soon. Some work needed
      maxChars: 128,
      minChars: 3,
      positioningStrategy: 'fixed',
      linkTarget: '_self',
      fixMentionsToQuill: false,
      isolateCharacter: true,
      allowInlineMentionChar: true,
      defaultMenuOrientation: 'bottom',
      dataAttributes: ['id', 'value', 'avatar', 'link'],
      renderItem: (item: Mention, searchTerm: any) => {
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
      source: async (
        searchTerm: string,
        renderList: any,
        denotationChar: string
      ) => {
        if (denotationChar === '@') {
          let matches = await this.updateMentionsSuggestions(searchTerm);
          if (searchTerm.length > 0) {
            matches = matches.filter(
              (m) =>
                m.value.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
            );
          }
          renderList(
            matches.map((m) => ({ ...m, type: 'mention' })),
            searchTerm
          );
        }
        if (denotationChar === ':') {
          const matches = this.emojiCollections
            .map((elem) => {
              const emojis = elem.emojis.filter((emoji) =>
                emoji.id == emoji.name && emoji.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
              return emojis.map(
                (emoji) =>
                ({
                  type: 'emoji',
                  value: emoji.name,
                  avatar: `${environment.baseMediaUrl}${emoji.url}`,
                  id: emoji.id,
                  remoteId: emoji.id,
                } as Mention)
              );
            })
            .flat()
            .slice(0, 10);
          renderList(matches, searchTerm);
        }
      },
    },
    toolbar: [],
  };

  // TODO fill with custom formating. no clue yet
  customOptions = [];

  maxFileUploadSize = parseInt(environment.maxUploadSize) * 1024 * 1024;

  emojiCollections: EmojiCollection[] = [];
  subscription: Subscription;

  get idPostToReblog() {
    return this.data?.post?.id;
  }

  constructor(
    private editorService: EditorService,
    private messages: MessageService,
    private mediaService: MediaService,
    private jwtService: JwtService,
    private dashboardService: DashboardService,
    private postService: PostsService,
    private dialogRef: MatDialogRef<PostEditorComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      post?: ProcessedPost;
      edit?: boolean;
      quote?: ProcessedPost;
    },
    private loginService: LoginService
  ) {
    this.privacy = this.loginService.getUserDefaultPostPrivacyLevel();
    this.subscription = this.postService.updateFollowers.subscribe(() => {
      this.emojiCollections = this.postService.emojiCollections;
    });
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getInitialMentionsHTML() {
    const usersToMention: { id: string; url: string; remoteId: string }[] = [];
    const post = this.data?.post;
    const currentUserId = this.jwtService.getTokenData().userId;
    if (this.data?.quote && this.data.quote.user.id !== currentUserId) {
      const quotedUser = this.data.quote.user;
      usersToMention.push({
        url: quotedUser.url.startsWith('@')
          ? quotedUser.url
          : '@' + quotedUser.url,
        id: quotedUser.id,
        remoteId: quotedUser.remoteId
          ? quotedUser.remoteId
          : `${environment.frontUrl}/blog/${quotedUser.url}`,
      });
    }
    if (post) {
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
    }

    const mentionsHtml = usersToMention
      .map((mention) => this.getMentionHtml({
        id: mention.id,
        value: mention.id,
        remoteId: mention.remoteId,
        type: 'mention',
        avatar: '',
        url: mention.url
      }))
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
        remoteId: data.link ? data.link : '',
        avatar: '',
        type: data.value.startsWith(':') ? 'emoji' : 'mention',
        value: ''
      }).trim();
      return newNode.firstElementChild;
    };
    mentionBlot.tagName = 'span'; // we substitute it in the back
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
    const content = this.postCreatorContent ? this.postCreatorContent : ''
    // if a post includes only tags, we reblog it and then we also create the post with tags. Thanks shadowjonathan
    if(this.uploadedMedias.length === 0 && content.length === 0 && tagsToSend.length > 0 && this.idPostToReblog && ! this.data?.quote?.id) {
      await this.editorService.createPost({
        content: '',
        idPostToReblog: this.idPostToReblog,
        privacy: 0,
        media: [],
      });
      // wait 500 miliseconds
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    res = await this.editorService.createPost({
      content: content,
      media: this.uploadedMedias,
      privacy: this.privacy,
      tags: tagsToSend,
      idPostToReblog: this.editing ? undefined : this.idPostToReblog,
      contentWarning: this.contentWarning,
      idPostToEdit: this.editing ? this.idPostToReblog : undefined,
      idPosToQuote: this.data?.quote?.id,
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


  allDescriptionsFilled(): boolean {
    const disableCheck = localStorage.getItem('disableForceAltText') === 'true';
    return disableCheck || this.uploadedMedias.every((med) => med.description);
  }

  getMentionHtml(mention: Mention): string {
    return mention.type === 'mention' ? `<a
    href="${mention.remoteId}"
    class="u-url h-card mention"
    data-id="${mention.id}"
    data-value="${mention.url}"
    data-link="${mention.remoteId}"
  >${mention.url.startsWith('@') ? mention.url : '@' + mention.url}</a>`
      : `<span>${mention.id}</span>`
  }

  deleteImage(index: number) {
    // TODO we should look how to clean the disk at some point. A call to delete the media would be nice
    this.uploadedMedias.splice(index, 1);
  }

  async loadQuote() {
    const urlString = this.urlPostToQuote;
    this.quoteLoading = true;
    try {
      const url = new URL(urlString);
      let postToAdd: ProcessedPost | undefined;
      if (url.host === new URL(environment.frontUrl).host) {
        // URL is a local one.  We need to check if it includes an UUID
        const UUIDRegex =
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gm;
        const matches = urlString.match(UUIDRegex);
        if (matches) {
          const uuid = matches[0];
          const postFromBackend = await this.dashboardService.getPostV2(uuid);
          if (postFromBackend) {
            postToAdd = postFromBackend[postFromBackend.length - 1];
          }
        } else {
          this.messages.add({
            severity: 'error',
            summary: 'Sorry the url you pasted does not seem to be valid',
          });
        }
      } else {
        // url is external. we call the search function
        const searchResult = await this.dashboardService.getSearchPage(
          0,
          urlString
        );
        if (
          searchResult &&
          searchResult.posts &&
          searchResult.posts.length > 0
        ) {
          postToAdd = searchResult.posts[0][searchResult.posts[0].length - 1];
        }
      }
      if (postToAdd) {
        if (
          postToAdd.privacy === 10 ||
          postToAdd.privacy === 1 ||
          postToAdd.privacy === 2
        ) {
          this.messages.add({
            severity: 'error',
            summary:
              'Sorry the post you selected is not quotable because of settings of the user',
          });
        } else {
          postToAdd.quotes = [];
          if (this.data) {
            this.data.quote = postToAdd;
          } else {
            this.data = { quote: postToAdd };
          }
        }
      } else {
        this.messages.add({
          severity: 'error',
          summary: 'Sorry we could not find the post you requested',
        });
      }
    } catch (error) {
      console.log(error);
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong when trying to load this.',
      });
    }
    this.quoteLoading = false;
  }

  emojiAdded(emoji: Emoji) {
    this.postCreatorContent = `${this.postCreatorContent} ${emoji.name}`;
    this.messages.add({
      severity: 'success',
      summary: `Emoji ${emoji.name} has been added to the post`,
    });
  }

  getPrivacyIcon(){
    const res =  this.privacyOptions.find(elem => elem.level === this.privacy)?.icon as IconDefinition
    return res;
  }
}
