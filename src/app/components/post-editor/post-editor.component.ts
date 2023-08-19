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
  newImageDescription = '';
  newImageNSFW = false;
  newImageAdult = false;
  newImageFile: File | undefined;
  disableImageUploadButton = false;
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
      fixMentionsToQuill: true,
      defaultMenuOrientation: 'bottom',
      onSelect: (item: any, insertItem: any) => {
        item.denotationChar = ''
        console.log(item)
        const elem = this.mentionSuggestions[item.index]
        item.value = ' <a href="' + elem.remoteId + '"><span class="mention" data-denotation-char="" data-id="' + elem.id +'" data-value="' + elem.url + '">﻿<span contenteditable="false"><span class="ql-mention-denotation-char"></span>' + elem.url + '</span></span></a>'
        const editor = this.quill.quillEditor
        insertItem(item)
        // necessary because quill-mention triggers changes as 'api' instead of 'user'
        editor.insertText(editor.getLength() - 1, '', 'user')
      },
      source: async (searchTerm: string, renderList: any) => {
        await this.updateMentionsSuggestions(searchTerm)
        const values = this.mentionSuggestions.map(elem => {
          return {
            id: elem.id,
            value: elem.url.replaceAll('@', '_').replace('_','@'),
            avatar: elem.avatar,
            remoteId: elem.remoteId ? elem.remoteId : `${elem.frontUrl}/blog/${elem.url}` }
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

  showEditorSubscription: Subscription;



  maxFileUploadSize = parseInt(environment.maxUploadSize) * 1024 * 1024;

  constructor(
    private editorService: EditorService,
    private messages: MessageService,
    private mediaService: MediaService,
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
        this.tags = [];
        const usersToMention: {id: string, url: string, remoteId: string}[] = [];
        if(inResponseTo) {
          this.contentWarning = inResponseTo.content_warning
          const parentPrivacy = this.privacyOptions.find(elem => elem.level === inResponseTo.privacy);
          if(parentPrivacy?.level !== 0) {
            this.enablePrivacyEdition = false;
          }
          this.privacy = parentPrivacy ? parentPrivacy : this.privacyOptions[0]
          if(inResponseTo.user.url.startsWith('@')) {
            usersToMention.push({
              id: inResponseTo.user.id,
              url: inResponseTo.user.url.startsWith('@') ? inResponseTo.user.url : '@' +inResponseTo.user.url,
              remoteId: inResponseTo.user.remoteId ? inResponseTo.user.remoteId : `environment.frontUrl/blog/${inResponseTo.user.url}`
            })
          }
          inResponseTo.mentionPost?.forEach((mention) => {
            if(!usersToMention.map(elem => elem.id).includes(mention.id)) {
              usersToMention.push({
                url: mention.url.startsWith('@') ? mention.url : '@' + mention.url,
                id: mention.id,
                remoteId: mention.remoteId ? mention.remoteId : `environment.frontUrl/blog/${mention.url}`
              })
            }
          });
        }
        let mentionsHtml = '';
        usersToMention.forEach(elem => {
          mentionsHtml = mentionsHtml + ' <a href="' + elem.remoteId + '"><span class="mention" data-denotation-char="" data-id="' + elem.id +'" data-value="' + elem.url + '">﻿<span contenteditable="false"><span class="ql-mention-denotation-char"></span>' + elem.url + '</span></span></a>'
        })
        this.postCreatorContent = `<p>${mentionsHtml}</p>`
        this.openEditor()
      }
    });
  }

  ngOnInit(): void {
  }


  openEditor() {
    this.editorVisible = true;
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
    this.fixNullPosting()
    res = await this.editorService.createPost(this.postCreatorContent, this.privacy.level, tagsToSend, this.idPostToReblog, this.contentWarning);
    if (res) {
      this.messages.add({
        severity: 'success',
        summary: 'Your post has been published!'
      });
      this.postCreatorContent = '';
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
          if(this.newImageDescription !== '' || this.newImageNSFW || this.newImageAdult ){
            await this.mediaService.updateMedia(response.id, this.newImageDescription, this.newImageNSFW, this.newImageAdult);
          }
          this.fixNullPosting();
          this.postCreatorContent = `${this.postCreatorContent}[wafrnmediaid="${response.id}"]`
        }
      });
      this.newImageDescription = '';
      this.newImageNSFW = false;
      this.newImageAdult = false;
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

  adultContentUpdated() {
    this.newImageNSFW = this.newImageAdult ? true : this.newImageNSFW;
  }

  ngOnDestroy(): void {
    this.showEditorSubscription.unsubscribe();
  }

}
