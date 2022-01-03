import { Component, Input, OnInit } from '@angular/core';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-post-fragment',
  templateUrl: './post-fragment.component.html',
  styleUrls: ['./post-fragment.component.scss']
})
export class PostFragmentComponent implements OnInit {

  @Input() content!: ProcessedPost;
  ready = false;
  mediaBaseUrl = environment.baseMediaUrl;

  constructor() { }

  ngOnInit(): void {
    this.ready = true;
  }

}
