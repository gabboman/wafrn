import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  MessageService
} from 'primeng/api';
import {
  EditorService
} from 'src/app/services/editor.service';
import { MediaService } from 'src/app/services/media.service';
import {
  PostsService
} from 'src/app/services/posts.service';
import {
  environment
} from 'src/environments/environment';
import { QuillEditorComponent } from 'ngx-quill'
import { Subscription } from 'rxjs';
import { Action } from 'src/app/interfaces/editor-launcher-data';
import 'quill-mention'
import { JwtService } from 'src/app/services/jwt.service';
import { WafrnMedia } from 'src/app/interfaces/wafrn-media';
import { DashboardService } from 'src/app/services/dashboard.service';

@Component({
  selector: 'app-post-editor',
  templateUrl: './post-editor.component.html',
  styleUrls: ['./post-editor.component.scss']
})
export class PostEditorComponent implements OnInit, OnDestroy {

  privacyOptions = [
    {level: 0, name: 'Public'},
    {level: 1, name: 'Followers only'},
    {level: 2, name: 'This instance only'},
    {level: 10, name: 'Direct Message'},
  ]
  idPostToReblog: string | undefined;
  editorVisible: boolean = false;
  postCreatorContent: string = '';
  tags: string[] = [];
  privacy;
  @ViewChild('quill') quill!: QuillEditorComponent;
  // upload media variables
  newImageFile: File | undefined;
  disableImageUploadButton = false;
  uploadedMedias: WafrnMedia[] = []
  uploadImageUrl = `${environment.baseUrl}/uploadMedia`;
  @ViewChild('uploadImagesPanel') uploadImagesPanel: any;

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
      allowedChars: /^[A-Z0-9a-z_.]*$/,
      mentionDenotationChars: ['@'],
      maxChars: 128,
      minChars: 3,
      linkTarget: '_blank',
      fixMentionsToQuill: true,
      isolateCharacter: true,
      allowInlineMentionChar: true,
      defaultMenuOrientation: 'bottom',
      renderItem: (item: any, searchTerm: any) => {
        const itemString =   `<div><img src="${item.avatar}" style="max-height: 24px; max-width: 24px;" /> ${item.value}</div>`
        console.log(this.postCreatorContent)
        return new DOMParser().parseFromString(itemString, 'text/html').body.childNodes[0]
      },
      source: async (searchTerm: string, renderList: any) => {
        await this.updateMentionsSuggestions(searchTerm)
        const values = this.mentionSuggestions.map(elem => {
          let url = elem.url.replaceAll('@', '_').replace('_','@');
          url = url.startsWith('@')? url.substring(1) : url
          return {
            id: elem.id,
            value: url,
            avatar: elem.avatar,
            remoteId: elem.remoteId ? elem.remoteId : `${elem.frontUrl}/blog/${elem.url}`,
          }
        })

        if (searchTerm.length === 0) {
          renderList(values, searchTerm)
        } else {
          const matches: any = []

          values.forEach((entry) => {
            if (entry.value.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
              matches.push(entry)
            }
          })
          renderList(matches, searchTerm)
        }
      }
    },
    toolbar: []
  }

  // TODO fill with custom formating. no clue yet
  customOptions = [
  ]

  showEditorSubscription: Subscription;



  maxFileUploadSize = parseInt(environment.maxUploadSize) * 1024 * 1024;

  constructor(
    private editorService: EditorService,
    private messages: MessageService,
    private mediaService: MediaService,
    private jwtService: JwtService,
    private dashboardService: DashboardService,
  ) {
    this.privacy = this.privacyOptions[0]
    this.showEditorSubscription = this.editorService.launchPostEditorEmitter.subscribe((elem) => {
      if (elem.action === Action.New || elem.action === Action.Response) {
        this.enablePrivacyEdition = true;
        this.privacy = this.privacyOptions[0];
        this.contentWarning = '';
        this.idPostToReblog = elem.post?.id;
        const inResponseTo = elem.post;
        this.postCreatorContent = '';
        this.uploadedMedias = []
        this.tags = [];
        const usersToMention: {id: string, url: string, remoteId: string}[] = [];
        if(inResponseTo) {
          this.contentWarning = inResponseTo.content_warning
          const parentPrivacy = this.privacyOptions.find(elem => elem.level === inResponseTo.privacy);
          if(parentPrivacy?.level !== 0) {
            this.enablePrivacyEdition = false;
          }
          this.privacy = parentPrivacy ? parentPrivacy : this.privacyOptions[0]
          if(inResponseTo.userId != this.jwtService.getTokenData().userId) {
            usersToMention.push({
              id: inResponseTo.user.id,
              url: inResponseTo.user.url.startsWith('@') ? inResponseTo.user.url : '@' +inResponseTo.user.url,
              remoteId: inResponseTo.user.remoteId ? inResponseTo.user.remoteId : `${environment.frontUrl}/blog/${inResponseTo.user.url}`
            })
          }
          inResponseTo.mentionPost?.forEach((mention) => {
            if(!usersToMention.map(elem => elem.id).includes(mention.id) && mention.id != this.jwtService.getTokenData().userId) {
              usersToMention.push({
                url: mention.url.startsWith('@') ? mention.url : '@' + mention.url,
                id: mention.id,
                remoteId: mention.remoteId ? mention.remoteId : `${environment.frontUrl}/blog/${mention.url}`
              })
            }
          });
        }
        let mentionsHtml = '';
        usersToMention.forEach(elem => {
          mentionsHtml = mentionsHtml + this.getMentionHtml(elem)
        });
        if (mentionsHtml !== '') {
          mentionsHtml = mentionsHtml + '<span> </span>'
        }
        this.openEditor(mentionsHtml);
      }
    });
  }

  ngOnInit(): void {
  }


  openEditor( content?: string) {
    this.postCreatorContent = "";
    this.uploadedMedias = []
    this.quill.ngOnInit();
    this.editorVisible = true;
    if(content) {
      this.quill.quillEditor.clipboard.dangerouslyPasteHTML(content)
      this.quill.quillEditor.insertText(this.quill.quillEditor.getLength() - 1, '', 'user')
    }
  }

  postBeingSubmitted = false;
  async submitPost() {
    this.postBeingSubmitted = true;
    let tagsToSend = '';
    this.tags.forEach((elem) => {
      tagsToSend = `${tagsToSend}${elem.trim()},`;
    });
    tagsToSend = tagsToSend.slice(0, -1);
    let res = undefined;
    let mediasString = ''
    // this.fixNullPosting();
    if(this.uploadedMedias.length > 0) {
      const updateMediaPromises: Promise<any>[] = [];
      this.uploadedMedias.forEach(elem => {
        updateMediaPromises.push(this.mediaService.updateMedia(elem.id, elem.description, elem.NSFW, elem.adultContent));
        mediasString = `${mediasString}[wafrnmediaid="${elem.id}"]`
      })
      await Promise.allSettled(updateMediaPromises);
    }
    res = await this.editorService.createPost((this.postCreatorContent ? this.postCreatorContent : '') + mediasString, this.privacy.level, tagsToSend, this.idPostToReblog, this.contentWarning);
    // its a great time to check notifications isnt it?
    this.dashboardService.scrollEventEmitter.emit('post')
    if (res) {
      this.messages.add({
        severity: 'success',
        summary: 'Your post has been published!'
      });
      this.postCreatorContent = '';
      this.uploadedMedias = []
      this.tags = [];
      this.editorVisible = false;
    } else {
      this.messages.add({
        severity: 'warn',
        summary: 'Something went wrong and your post was not published. Check your internet connection and try again'
      });

    }
    this.postBeingSubmitted = false;
  }

  closeEditor() {
    this.editorVisible = false;
  }

  fixNullPosting() {
    if (!this.postCreatorContent) {
      this.postCreatorContent = '';
      this.uploadedMedias = []

    }
  }

  imgSelected(filePickerEvent: any) {
    if (filePickerEvent.target.files[0]) {
      this.newImageFile = filePickerEvent.target.files[0];
    }
  }

  async uploadImage(event: any) {
    try {
      let responses = event.originalEvent.body;
      responses.forEach(async (response: any) => {
        if (response) {
          // This is something for a new feature. The modified editor...
          const newMedia: WafrnMedia = {
            id: response.id,
            adultContent: response.adultContent,
            NSFW: response.NSFW,
            description: response.description,
            external: response.external,
            url: environment.externalCacheurl + encodeURIComponent(`${environment.baseMediaUrl}${response.url}`)
          }
          this.uploadedMedias.push(newMedia)
        }
      });
      this.newImageFile = undefined;
      this.uploadImagesPanel.hide();
      this.messages.add({
        severity: 'success',
        summary: responses.length === 1 ? 'Image uploaded and added to the post!' : 'Images uploaded and added to the post'
      });
    } catch (error) {
      this.messages.add({
        severity: 'error',
        summary: 'Oh no! something went wrong'
      });
    }
    this.disableImageUploadButton = false;
  }

  uploadImageFailed() {
    this.messages.add({
      severity: 'error',
      summary: 'Image upload failed! Please send us details'
    });
  }

  async updateMentionsSuggestions(query: string){
    if(query){
      const backendResponse: any = await this.editorService.searchUser(query.replaceAll('_', '@'));
      if(backendResponse){
        this.mentionSuggestions = backendResponse.users? backendResponse.users : [];
        this.mentionSuggestions = this.mentionSuggestions.map((user) => {
          user.avatar = user.url.startsWith('@') ? this.cacheurl + encodeURIComponent(user.avatar) : this.baseMediaUrl + user.avatar;
          user.remoteId = user.remoteId ? user.remoteId : `${environment.frontUrl}/blog/${user.url}`
          return user;
        })
      }
    } else {
      this.mentionSuggestions = [];
    }
  }

  mentionUserSelected(selected: any){
    this.postCreatorContent = `${this.postCreatorContent}[mentionuserid="${selected.id}"]`;
    this.userSelectionMentionValue = '';
    this.mentionUserSearchPanel.hide();
  }

  adultContentUpdated(index: number) {
    this.uploadedMedias[index].NSFW = this.uploadedMedias[index].adultContent ? true : this.uploadedMedias[index].NSFW;
  }

  ngOnDestroy(): void {
    this.showEditorSubscription.unsubscribe();
  }

  getMentionHtml(mention: {id: string, url: string, remoteId: string}): string {
    return `<span><span data-denotation-char="@" data-id="${mention.id}" value="${mention.url}">${mention.url}</span></span>`
  }

  deleteImage(index: number) {
    // TODO we should look how to clean the disk at some point. A call to delete the media would be nice
    this.uploadedMedias.splice(index, 1)
  }

}
