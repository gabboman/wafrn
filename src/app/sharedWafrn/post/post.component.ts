import { ChangeDetectorRef, Component, Injector, Input, OnInit } from '@angular/core';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { PostsService } from 'src/app/services/posts.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit {

  @Input() post!: ProcessedPost[];
  ready = false;
  sanitizedPostContent: string[] = [];

  mediaBaseUrl = environment.baseMediaUrl;
  videoWidth: number = 0;
  videoHeight: number = 0;


  constructor(
    private postService: PostsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.sanitizedPostContent = this.post.map((elem) => this.postService.getPostHtml(elem.content));

    this.onResize();

    window.addEventListener('resize', this.onResize);

    this.ready = true;
  }



  onResize = (): void => {

    // Automatically expand the video to fit the page up to 1200px x 720px

    //first post width:

    let firstPostWidth = document.getElementById('firstPost')?.clientWidth

    this.videoWidth = firstPostWidth ? firstPostWidth * 0.93 : 480;

    this.videoHeight = this.videoWidth * 0.6;

    // this.cdr.detectChanges();

  }



  ngOnDestroy(): void {

    window.removeEventListener('resize', this.onResize);

  }

}

