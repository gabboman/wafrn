import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProcessedPost } from '../interfaces/processed-post';
import { RawPost } from '../interfaces/raw-post';
import { MediaService } from './media.service';
import * as DOMPurify from 'dompurify';
@Injectable({
  providedIn: 'root'
})
export class PostsService {

  constructor(
    private mediaService: MediaService,
    private sanitizer: DomSanitizer,
  ) { }


  processPost(rawPost: RawPost): ProcessedPost[] {
    let result: ProcessedPost[] = [];
    if(rawPost.ancestors) {
      rawPost.ancestors.forEach((post: RawPost) => {
        result.push(post);
      } );
      result.push(rawPost);
    }
    result.forEach( val => {
      this.mediaService.addMediaToMap(val);
    });
    return result;
  }


  getPostHtml(content: string): SafeHtml {
    
    let sanitized = DOMPurify.sanitize(content,{ALLOWED_TAGS: ['b', 'i', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']});
    // we remove stuff like img and script tags. we only allow certain stuff
    

    return this.sanitizer.bypassSecurityTrustHtml(sanitized);

  }
}
