import { Injectable } from '@angular/core'
import { PostsService } from './posts.service'

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  constructor(private postsService: PostsService) {}

  objectToFormData(obj: any): FormData {
    const res = new FormData()
    Object.keys(obj).forEach((key: string) => {
      res.append(key, obj[key])
    })
    return res
  }

  async getSilencedPostIds(): Promise<string[]> {
    return this.postsService.silencedPostsIds
  }
}
