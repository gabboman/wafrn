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
      allowedChars: /^[A-Z0-9a-z_@.]*$/,
      onSelect: (item: any, insertItem: any) => {
        item.denotationChar = ''
        item.value = `[mentionuserid="${item.id}"]`
        const editor = this.quill.quillEditor
        insertItem(item)
        // necessary because quill-mention triggers changes as 'api' instead of 'user'
        editor.insertText(editor.getLength() - 1, '', 'user')
      },
      source: async (searchTerm: string, renderList: any) => {
        await this.updateMentionsSuggestions(searchTerm)
        const values = this.mentionSuggestions.map(elem => {return {id: elem.id, value: elem.url, avatar: elem.avatar}})

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
    private postsService: PostsService,
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
        if(inResponseTo) {
          console.log(inResponseTo)
          this.contentWarning = inResponseTo.content_warning
          const parentPrivacy = this.privacyOptions.find(elem => elem.level === inResponseTo.privacy);
          if(parentPrivacy?.level !== 0) {
            this.enablePrivacyEdition = false;
          }
          this.privacy = parentPrivacy ? parentPrivacy : this.privacyOptions[0]
          if(inResponseTo.user.url.startsWith('@')) {
            this.postCreatorContent = `${this.postCreatorContent}[mentionuserid="${inResponseTo.user.id}"]`
          }
          inResponseTo.mentionPost?.forEach((mention) => {
            if(mention?.url.startsWith('@')) {
              this.postCreatorContent = `${this.postCreatorContent}[mentionuserid="${mention.id}"]`
            }
          });
        }
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
      const backendResponse: any = await this.editorService.searchUser(query);
      if(backendResponse){
        this.mentionSuggestions = backendResponse.users? backendResponse.users : [];
        this.mentionSuggestions = this.mentionSuggestions.map((user) => {
          user.avatar = user.url.startsWith('@') ? this.cacheurl + encodeURIComponent(user.avatar) : this.baseMediaUrl + user.avatar;
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
