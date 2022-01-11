import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';
import { EditorService } from 'src/app/services/editor.service';
import { JwtService } from 'src/app/services/jwt.service';
import { PostsService } from 'src/app/services/posts.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  posts: ProcessedPost[][] = [];
  viewedPosts = 0;

  idPostToReblog: string | undefined;
  editorVisible: boolean = false;
  postCreatorContent: string = '';
  tags: string[] = [];
  captchaResponse: string | undefined;
  captchaKey = environment.recaptchaPublic;



  menuItems: MenuItem[] = [
    {
      label: 'Write',
      icon: "pi pi-pencil",
      command: () => this.newEditor()
    },
    {
      label: 'Search',
      icon: "pi pi-search",
      routerLink: '/dashboard/search'
    },
    {
      label: 'My blog',
      icon: "pi pi-user",
      routerLink: '/blog/'
    },
    {
      label: 'Profile',
      icon: "pi pi-cog",
      disabled: true
    },
    {
      label: 'Log out',
      icon: 'pi pi-sign-out',
      command: () => {localStorage.clear(); this.router.navigate(['/'])}
    }
  ];

  constructor(
    private dashboardService: DashboardService,
    private editor: EditorService,
    private cdr: ChangeDetectorRef,
    private messages: MessageService,
    private postsService: PostsService,
    private jwtService: JwtService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    if(!this.jwtService.tokenValid()) {
      localStorage.clear();
      this.router.navigate(['/']);
    }
    this.menuItems[2].routerLink = '/blog/' + this.jwtService.getTokenData()['url']
    await this.loadPosts(0);
    this.postsService.launchPostEditorEmitter.subscribe((elem) => {
      if(elem) {
        this.idPostToReblog = elem;
        this.editorVisible = true;
      }
    });

  }

  async countViewedPost() {
    this.viewedPosts++;
    if (this.posts.length - 3 < this.viewedPosts) {
      await this.loadPosts(Math.floor(this.posts.length / 20));
    }
  }

  async loadPosts(page: number) {

    let tmpPosts = await this.dashboardService.getDashboardPage(page);
    tmpPosts.forEach(post => {
      this.posts.push(post);
    })
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
    let tagsToSend = '';
    this.tags.forEach((elem) => {
      tagsToSend = tagsToSend + elem.trim() +',' ;
    });
    tagsToSend = tagsToSend.slice(0, -1);
    let res = undefined;
    if(this.captchaResponse) {
      res = await this.editor.createPost(this.postCreatorContent, this.captchaResponse, tagsToSend , this.idPostToReblog);
    }
    if(res) {
      this.messages.add({ severity: 'success', summary: 'Your post has been published!' });
      this.postCreatorContent = '';
      this.tags = [];
      this.editorVisible = false;
    } else {
      this.messages.add({ severity: 'warn', summary: 'Something went wrong and your post was not published. Check your internet connection and try again' });

    }
    this.postBeingSubmitted = false;
  }

  closeEditor() {
    this.editorVisible = false;
  }

  captchaResolved(event: any) {
    this.captchaResponse = event.response;

  }

  captchaExpired() {
    this.captchaResponse = undefined;
  }


  // upload media variables
  displayUploadImagePanel = false;
  newImageDescription = '';
  newImageNSFW = false;
  newImageFile: File | undefined;
  @ViewChild('uploadImagesPanel') uploadImagesPanel: any;

  imgSelected(filePickerEvent: any) {
    if (filePickerEvent.target.files[0]) {
      this.newImageFile = filePickerEvent.target.files[0];
    }
  }

  async uploadImage() {

    if (this.newImageFile) {
      let response = await this.editor.uploadMedia(this.newImageDescription, this.newImageNSFW, this.newImageFile);
      if(response) {
        this.newImageDescription = '';
        this.newImageNSFW = false;
        this.newImageFile = undefined;
        this.displayUploadImagePanel = false;
        this.postCreatorContent = this.postCreatorContent + '[wafrnmediaid="'+ response.id +'"]'
        this.uploadImagesPanel.hide();
        this.messages.add({ severity: 'success', summary: 'Image uploaded and added to the post!' });
      } else {
        this.messages.add({ severity: 'error', summary: 'Image not uploaded! Please make sure it is smaller than the max size, and if the problem persits, email us!' });

      }
    }


  }



}
