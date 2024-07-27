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
    const res =  await firstValueFrom(this.http.get<followsResponse[]>(environment.baseUrl + `/user/${url}/follows?followers=${followed.toString()}`));
    // we get all data on the front. we could order it on the back but that is server time
    // also its two different queries so its double work. here is just once! also 
    res.sort((a, b) => new Date(b.follows.createdAt).getTime() - new Date(a.follows.createdAt).getTime() )
    return res;
  }

  async deleteFollow(id: string): Promise<boolean>   {
    const res = await firstValueFrom(this.http.get(environment.baseUrl + `/user/deleteFollow/${id}`))
    return true;
  }
  
  async approveFollow(id: string): Promise<boolean> {
    const res = await firstValueFrom(this.http.get(environment.baseUrl + `/user/approveFollow/${id}`))

    return true;
  }
}
