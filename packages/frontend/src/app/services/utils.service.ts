import { Injectable } from '@angular/core'
import { PostsService } from './posts.service'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { EnvironmentService } from './environment.service'

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  constructor(
    private postsService: PostsService,
    private http: HttpClient
  ) {}

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

  async getBlockedServers(): Promise<string[]> {
    const servers = await firstValueFrom(
      this.http.get<{ displayName: string }[]>(`${EnvironmentService.environment.baseUrl}/status/blocks`)
    )
    let result = servers.map((elem) => elem.displayName.toLowerCase().trim()).filter((elem) => elem != '')
    return result.sort()
  }
}
