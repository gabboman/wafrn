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


  wafrnMediaRegex = /\[wafrnmediaid="[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}"\]/gm;
  uuidRegex = /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/

  constructor(
    private mediaService: MediaService,
    private sanitizer: DomSanitizer,
  ) { }


  processPost(rawPost: RawPost): ProcessedPost[] {
    let result: ProcessedPost[] = [];
    if (rawPost.ancestors) {
      rawPost.ancestors.forEach((post: RawPost) => {
        result.push(post);
      });
      result.push(rawPost);
    }
    result.forEach(val => {
      this.mediaService.addMediaToMap(val);
    });
    return result;
  }


  getPostHtml(content: string): string {

    const replacements: Array<{ wafrnMediaStringToReplace: string, id: string}> = [];

    let sanitized = DOMPurify.sanitize(content, { ALLOWED_TAGS: ['b', 'i', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] });
    // we remove stuff like img and script tags. we only allow certain stuff.
    sanitized.match(this.wafrnMediaRegex)?.forEach((media) => {
      let id = '0';
      const uuid = media.match(this.uuidRegex);
      if(uuid) {
        id = uuid[0]
      }
      replacements.push({ wafrnMediaStringToReplace: media, id: id });
    });

    replacements.forEach( replacement => {
      const replacementString = '<app-wafrn-media [id]=\'"' + replacement.id + '\'" > </app-wafrn-media>'
      sanitized = sanitized.replace(replacement.wafrnMediaStringToReplace, replacementString);
      
    })


    return sanitized;

  }
}
