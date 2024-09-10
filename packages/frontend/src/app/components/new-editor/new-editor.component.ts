import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome';
import { faClose, faEnvelope, faGlobe, faQuoteLeft, faServer, faUnlock, faUser } from '@fortawesome/free-solid-svg-icons';
import { EditorData } from 'src/app/interfaces/editor-data';
import { PostHeaderComponent } from '../post/post-header/post-header.component';
import { PostFragmentComponent } from '../post-fragment/post-fragment.component';
import { environment } from 'src/environments/environment';
import { QuestionPollQuestion } from 'src/app/interfaces/questionPoll';
import { SingleAskComponent } from '../single-ask/single-ask.component';
import { MatMenuModule } from '@angular/material/menu';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { WafrnMedia } from 'src/app/interfaces/wafrn-media';
import { MessageService } from 'src/app/services/message.service';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';

@Component({
  selector: 'app-new-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FontAwesomeModule,
    PostHeaderComponent,
    PostFragmentComponent,
    SingleAskComponent,
    MatMenuModule,
    FileUploadComponent,

  ],
  templateUrl: './new-editor.component.html',
  styleUrl: './new-editor.component.scss'
})
export class NewEditorComponent {
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
  data: EditorData | undefined;
  editing = false;
  baseMediaUrl = environment.baseMediaUrl;
  cacheurl = environment.externalCacheurl;
  userSelectionMentionValue = '';
  contentWarning = '';
  enablePrivacyEdition = true;
  pollQuestions: QuestionPollQuestion[] = []
  disableImageUploadButton = false;
  uploadedMedias: WafrnMedia[] = [];


  showContentWarning = false;
  displayMarqueeButton = false;
  postCreatorContent: string = '';
  initialContent = '';
  tags: string = '';
  privacy: number = 0;
  urlPostToQuote: string = '';
  quoteLoading = false;

  constructor(
    private router: Router,
    private messages: MessageService,
    private dashboardService: DashboardService
  ) {

  }

  get privacyOption() {
    return this.privacyOptions.find((elem) => elem.level === this.privacy);
  }

  getPrivacyIcon() {
    const res = this.privacyOptions.find(elem => elem.level === this.privacy)?.icon as IconDefinition
    return res;
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
            this.data = {
              scrollDate: new Date(),
              path: '/',
              quote: postToAdd
            };
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


  closeEditor() {
    if(!this.data) {
      this.router.navigate(['/'])
    } else {
      this.router.navigate([this.data.path])
    }
  }

}
