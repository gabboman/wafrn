import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { unlinkedPosts } from '../interfaces/unlinked-posts';
import { PostsService } from './posts.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  constructor(private http: HttpClient, private postService: PostsService) { }

  async getForumThread(id: string) {
    const response: unlinkedPosts = await firstValueFrom(
      this.http.get<unlinkedPosts>(environment.baseUrl + '/forum/' + id)
    );
    let processed = this.postService.processPostNew(response);
    processed = processed.filter(
      (post) => !this.postService.postContainsBlockedOrMuted(post, false)
    );
    let result = processed.map(elem => elem[elem.length - 1]).concat([processed[0][0]])
    result = result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() )
    return result;
  }
}
