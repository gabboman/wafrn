import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Follower } from '../interfaces/follower';
import { Reblog } from '../interfaces/reblog';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  //lastTimeChecked: Date = new Date();
  notificationsScrollTime: Date = new Date();
    constructor(
    private http: HttpClient,
    private jwt: JwtService
  ) { }

  async getUnseenNotifications(): Promise<string> {
    let res = '';
    let total = 0;
    try {
      const lastTimeCheckedString = localStorage.getItem('lastTimeCheckNotifications')
      const lastTimeChecked = lastTimeCheckedString ? new Date(lastTimeCheckedString) : new Date(1);
      let petitionData: HttpParams = new HttpParams();
      petitionData = petitionData.set('startScroll', lastTimeChecked.getTime().toString());
      const notifications = await this.http.get<{notifications: number}>(`${environment.baseUrl}/notificationsCount`, {params: petitionData}).toPromise();
      total = notifications ? notifications.notifications : 0;
      if(total > 0) {
        res = total.toString();
      }

    } catch (error) {
      console.warn('error processing notifications')
    }

    return res;
  }

  async getNotificationsScroll(page: number, resetDate=true): Promise<{follows: Follower[], reblogs: Reblog[], mentions: Reblog[], likes: Reblog[]}> {
    if (!this.jwt.tokenValid()) {
      return {follows: [], reblogs: [], mentions: [], likes: []}
    }
    let dateToCheck = this.notificationsScrollTime;
    if(page === 0) {
      if (resetDate && this.notificationsScrollTime) {
        this.notificationsScrollTime = new Date();
        dateToCheck = this.notificationsScrollTime;
      } else {
        dateToCheck = new Date()
      }
    }
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('page', page.toString());
    petitionData = petitionData.set('startScroll', dateToCheck.getTime().toString());
    const tmp = await this.http.get<{follows: Follower[], reblogs: Reblog[], mentions: Reblog[], likes: any[]}>(`${environment.baseUrl}/notificationsScroll`, {params: petitionData}).toPromise();
    if(tmp){
      tmp.follows = tmp.follows.map((follow) => {return {createdAt: new Date(follow.createdAt), url: follow.url, avatar: follow.avatar }});
      tmp.likes = tmp.likes.map((like)=> {return {user: like.user, content: '', id: like.postId, createdAt: new Date(like.createdAt)}});
      tmp.mentions = tmp.mentions.map((mention)=> {return {user: mention.user, content: '', id: mention.id, createdAt: new Date(mention.createdAt)}});
      tmp.reblogs = tmp.reblogs.map((reblog)=> {return {user: reblog.user, content: '', id: reblog.id, createdAt: new Date(reblog.createdAt)}});
    }
    return tmp ? tmp : { follows: [], reblogs: [], mentions: [], likes: []};
  }



}
