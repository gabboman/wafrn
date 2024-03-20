import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Follower } from '../interfaces/follower';
import { Reblog } from '../interfaces/reblog';
import { JwtService } from './jwt.service';
import { firstValueFrom } from 'rxjs';
import { SimplifiedUser } from '../interfaces/simplified-user';
import { basicPost } from '../interfaces/unlinked-posts';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  //lastTimeChecked: Date = new Date();
  notificationsScrollTime: Date = new Date();
  constructor(private http: HttpClient, private jwt: JwtService) {}

  async getUnseenNotifications(): Promise<{
    notifications: number;
    reports: number;
    awaitingAproval: number;
  }> {
    let res = {
      notifications: 0,
      reports: 0,
      awaitingAproval: 0,
    };
    try {
      const lastTimeCheckedString = localStorage.getItem(
        'lastTimeCheckNotifications'
      );
      const lastTimeChecked = lastTimeCheckedString
        ? new Date(lastTimeCheckedString)
        : new Date(1);
      let petitionData: HttpParams = new HttpParams();
      petitionData = petitionData.set(
        'startScroll',
        lastTimeChecked.getTime().toString()
      );
      const notifications = await firstValueFrom(
        this.http.get<{
          notifications: number;
          reports: number;
          awaitingAproval: number;
        }>(`${environment.baseUrl}/v2/notificationsCount`, {
          params: petitionData,
        })
      );
      res = notifications ? notifications : res;
    } catch (error) {
      console.warn('error processing notifications');
    }

    return res;
  }

  async getNotificationsScroll(
    page: number,
    resetDate = true
  ): Promise<{
    follows: Follower[];
    reblogs: Reblog[];
    mentions: Reblog[];
    likes: Reblog[];
  }> {
    if (!this.jwt.tokenValid()) {
      return { follows: [], reblogs: [], mentions: [], likes: [] };
    }
    let dateToCheck = this.notificationsScrollTime;
    if (page === 0) {
      if (resetDate && this.notificationsScrollTime) {
        this.notificationsScrollTime = new Date();
        dateToCheck = this.notificationsScrollTime;
      } else {
        dateToCheck = new Date();
      }
    }
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('page', page.toString());
    petitionData = petitionData.set(
      'startScroll',
      dateToCheck.getTime().toString()
    );
    const tmp = await firstValueFrom(
      this.http.get<{
        users: SimplifiedUser[];
        posts: basicPost[];
        follows: any[];
        reblogs: any[];
        mentions: any[];
        likes: any[];
      }>(`${environment.baseUrl}/v2/notificationsScroll`, {
        params: petitionData,
      })
    );
    if (tmp) {
      tmp.follows = tmp.follows.map((follow) => {
        return {
          createdAt: new Date(follow.createdAt),
          url: follow.url,
          avatar: follow.avatar,
        };
      });
      tmp.likes = tmp.likes.map((like) => {
        return {
          user: like.user,
          content: '',
          id: like.postId,
          createdAt: new Date(like.createdAt),
        };
      });
      tmp.mentions = tmp.mentions.map((mention) => {
        if (!tmp.users.find((usr) => usr.id === mention.userId)) {
          console.log('USER MISSING: ' + mention.userId + ',' + mention.id);
        }
        return {
          user: tmp.users.find((usr) => usr.id === mention.userId),
          content: mention.content,
          id: mention.id,
          createdAt: new Date(mention.createdAt),
        };
      });
      tmp.reblogs = tmp.reblogs.map((reblog) => {
        return {
          user: tmp.users.find((usr) => usr.id === reblog.userId),
          content: '',
          id: reblog.id,
          createdAt: new Date(reblog.createdAt),
        };
      });
    }
    return tmp ? tmp : { follows: [], reblogs: [], mentions: [], likes: [] };
  }
}
