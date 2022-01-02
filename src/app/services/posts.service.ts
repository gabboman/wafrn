import { Injectable } from '@angular/core';
import { ProcessedPost } from '../interfaces/processed-post';
import { RawPost } from '../interfaces/raw-post';
import { MediaService } from './media.service';

@Injectable({
  providedIn: 'root'
})
export class PostsService {

  constructor(
    private mediaService: MediaService
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
}
