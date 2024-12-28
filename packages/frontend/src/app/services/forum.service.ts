import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { unlinkedPosts } from '../interfaces/unlinked-posts'
import { PostsService } from './posts.service'
import { EnvironmentService } from './environment.service'

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  constructor(
    private http: HttpClient,
    private postService: PostsService
  ) {}

  async getForumThread(id: string) {
    const response: unlinkedPosts = await firstValueFrom(
      this.http.get<unlinkedPosts>(EnvironmentService.environment.baseUrl + '/forum/' + id)
    )
    this.postService.rewootedPosts = this.postService.rewootedPosts.concat(response.rewootIds)

    let processed = this.postService.processPostNew(response)
    processed = processed.filter((post) => !this.postService.postContainsBlockedOrMuted(post, false))
    let result = processed.length ? processed.map((elem) => elem[elem.length - 1]) : []
    result = result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    return result
  }
}
