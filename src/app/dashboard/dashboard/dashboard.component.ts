import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';
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
  editorVisible: boolean = true;
  postCreatorContent: string = ''
  captchaResponse: string | undefined;
  captchaKey = environment.recaptchaPublic;



  menuItems: MenuItem[] = [
    {
      label: 'Write',
      icon: "pi pi-pencil",
      command: () => this.newEditor()
    },
    {
      label: 'Upload media',
      icon: "pi pi-upload"
    },
    {
      label: 'Search',
      icon: "pi pi-search"
    },
    {
      label: 'My blog',
      icon: "pi pi-user"
    },
    {
      label: 'Profile',
      icon: "pi pi-cog"
    }
  ];

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadPosts(0);
  }

  async countViewedPost() {
    this.viewedPosts++;
    if (this.posts.length - 3 < this.viewedPosts) {
      await this.loadPosts(Math.floor(this.posts.length / 20) + 1);
    }
  }

  async loadPosts(page: number) {

    let tmpPosts = await this.dashboardService.getDashboardPage(page);
    tmpPosts.forEach(post => {
      this.posts.push(post);
    })
  }


  newEditor() {
    this.idPostToReblog = undefined;
    this.openEditor();
  }


  openEditor(){
    this.editorVisible = true;
  }

  async submitPost() {
    console.log(this.postCreatorContent);
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



}
