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
import { QuillEditorComponent, QuillModule } from 'ngx-quill'
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-post-editor',
  templateUrl: './post-editor.component.html',
  styleUrls: ['./post-editor.component.scss']
})
export class PostEditorComponent implements OnInit, OnDestroy {

  idPostToReblog: string | undefined;
  editorVisible: boolean = false;
  postCreatorContent: string = '';
  tags: string[] = [];
  captchaResponse: string | undefined;
  captchaKey = environment.recaptchaPublic;
  @ViewChild('quill') quill!: QuillEditorComponent;

  // upload media variables
  newImageDescription = '';
  newImageNSFW = false;
  newImageAdult = false;
  newImageFile: File | undefined;
  disableImageUploadButton = false;
  uploadImageUrl = environment.baseUrl + '/uploadMedia';
  @ViewChild('uploadImagesPanel') uploadImagesPanel: any;

  // add mention variables
  @ViewChild('mentionUserSearchPanel') mentionUserSearchPanel: any;
  mentionSuggestions: any[] = [];
  baseMediaUrl = environment.baseMediaUrl;
  userSelectionMentionValue = '';

  showEditorSubscription: Subscription;


  modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],  
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],  
      ['link'],                       // link
      ['clean'],                                         // remove formatting button
    ]
  };

  maxFileUploadSize = parseInt(environment.maxUploadSize) * 1024 * 1024;

  constructor(
    private editorService: EditorService,
    private postsService: PostsService,
    private messages: MessageService,
    private mediaService: MediaService,
    private recaptchaV3Service: ReCaptchaV3Service


  ) {
    this.showEditorSubscription = this.editorService.launchPostEditorEmitter.subscribe((elem) => {
      console.log(elem)
      if (elem != 'CLOSE' && elem != '') {
        this.idPostToReblog = elem.length === 36 ? elem : undefined;
        this.openEditor()
      }
    });
  }

  ngOnInit(): void {
  }


  // editor methods

  newEditor() {
    this.idPostToReblog = undefined;
    this.openEditor();
  }


  openEditor() {
    this.editorVisible = true;
  }

  postBeingSubmitted = false;
  async submitPost() {
    this.postBeingSubmitted = true;
    this.captchaResponse =  await this.recaptchaV3Service.execute('importantAction').toPromise();
    let tagsToSend = '';
    this.tags.forEach((elem) => {
      tagsToSend = tagsToSend + elem.trim() + ',';
    });
    tagsToSend = tagsToSend.slice(0, -1);
    let res = undefined;
    if (this.captchaResponse) {
      this.fixNullPosting()
      res = await this.editorService.createPost(this.postCreatorContent, this.captchaResponse, tagsToSend, this.idPostToReblog);
    }
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

  captchaResolved(event: any) {
    this.postBeingSubmitted = true;
    this.captchaResponse = event;
    this.submitPost();

  }

  captchaExpired() {
    this.captchaResponse = undefined;
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
          if(this.newImageDescription != '' || this.newImageNSFW || this.newImageAdult ){
            await this.mediaService.updateMedia(response.id, this.newImageDescription, this.newImageNSFW, this.newImageAdult);
          }
          this.fixNullPosting();
          this.postCreatorContent = this.postCreatorContent + '[wafrnmediaid="' + response.id + '"]'
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

  async updateMentionsSuggestions(ev: any){
    if(ev.query){
      const backendResponse: any = await this.editorService.searchUser(ev.query);
      if(backendResponse){
        this.mentionSuggestions = backendResponse.users? backendResponse.users : [];
      }
    } else {
      this.mentionSuggestions = [];
    }
  }

  mentionUserSelected(selected: any){
    this.postCreatorContent = this.postCreatorContent + '[mentionuserid="' + selected.id + '"]';
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
