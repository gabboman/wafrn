import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import { followsResponse } from '../interfaces/follows-response'
import { Ask } from '../interfaces/ask'
import { EnvironmentService } from './environment.service'

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  constructor(private http: HttpClient) {}

  async getFollowers(url: string, followed = false): Promise<followsResponse[]> {
    const res = await firstValueFrom(
      this.http.get<followsResponse[]>(
        EnvironmentService.environment.baseUrl + `/user/${url}/follows?followers=${followed.toString()}`
      )
    )
    // we get all data on the front. we could order it on the back but that is server time
    // also its two different queries so its double work. here is just once! also
    res.sort((a, b) => new Date(b.follows.createdAt).getTime() - new Date(a.follows.createdAt).getTime())
    return res
  }

  async deleteFollow(id: string): Promise<boolean> {
    const res = await firstValueFrom(this.http.get(EnvironmentService.environment.baseUrl + `/user/deleteFollow/${id}`))
    return true
  }

  async approveFollow(id: string): Promise<boolean> {
    const res = await firstValueFrom(
      this.http.get(EnvironmentService.environment.baseUrl + `/user/approveFollow/${id}`)
    )
    return true
  }

  async askuser(userUrl: string, value: object) {
    const res = await firstValueFrom(
      this.http.post(EnvironmentService.environment.baseUrl + `/user/${userUrl}/ask`, value)
    )
    return res
  }

  async ignoreAsk(ask: Ask) {
    const res = await firstValueFrom(
      this.http.post(EnvironmentService.environment.baseUrl + `/user/ignoreAsk`, {
        id: ask.id
      })
    )
    return res
  }
}
