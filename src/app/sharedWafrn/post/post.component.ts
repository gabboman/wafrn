import { Component, Injector, Input, OnInit } from '@angular/core';
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



  constructor(
    private postService: PostsService,
  ) { }

  ngOnInit(): void {
    this.sanitizedPostContent = this.post.map((elem) => this.postService.getPostHtml(elem.content));
    this.ready = true;
  }

}

