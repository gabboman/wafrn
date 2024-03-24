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
  constructor(private http: HttpClient, private postService: PostsService) {}

  async getForumThread(id: string) {
    const response: unlinkedPosts = await firstValueFrom(
      this.http.get<unlinkedPosts>(environment.baseUrl + '/forum/' + id)
    );
    let result = this.postService.processPostNew(response);
    result = result.filter(
      (post) => !this.postService.postContainsBlocked(post)
    );
    return result;
  }
}
