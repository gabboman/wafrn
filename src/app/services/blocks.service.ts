import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BlocksService {


  baseMediaUrl = environment.baseMediaUrl;
  baseCacheUrl = environment.externalCacheurl;

  constructor(
    private http: HttpClient
  ) { }

  processResponse(serverResponse: Array<any>) {
    return serverResponse.map(userBlocked => {
      return {
        avatar: userBlocked.blocked.url.startsWith('@') ? this.baseCacheUrl + encodeURIComponent(userBlocked.blocked.avatar) : this.baseMediaUrl + userBlocked.blocked.avatar,
        url: userBlocked.blocked.url = userBlocked.blocked.url,
        reason: userBlocked.reason,
        id: userBlocked.blocked.id
      }
    });
  }
  async getBlockList(): Promise<Array<any>> {
    const response = await this.http.get<Array<any>>(`${environment.baseUrl}/myBlocks`).toPromise();
    return response ? this.processResponse(response) : [];
  }

  async unblockUser(id: string): Promise<Array<any>> {
    const response = await this.http.post<Array<any>>(`${environment.baseUrl}/unblock-user?id=${encodeURIComponent(id)}`, {}).toPromise();
    return response ? this.processResponse(response) : [];
  }
}
