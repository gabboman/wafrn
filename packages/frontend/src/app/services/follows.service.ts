import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { followsResponse } from '../interfaces/follows-response';

@Injectable({
  providedIn: 'root'
})
export class FollowsService {

  constructor(
    private http: HttpClient
  ) {}

  async getFollowers(url: string, followed = false): Promise<followsResponse[]> {
    return await firstValueFrom(this.http.get<followsResponse[]>(environment.baseUrl + `/user/${url}/follows?followers=${followed.toString()}`))
  }
}
