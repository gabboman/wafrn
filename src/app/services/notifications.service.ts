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

  lastTimeChecked: Date = new Date();
  notificationsScrollTime: Date = new Date();
    constructor(
    private http: HttpClient,
    private jwt: JwtService
  ) { }

  async getNotifications(): Promise<{follows: Follower[], reblogs: Reblog[], mentions: Reblog[], likes: Reblog[]}> {
    this.lastTimeChecked = new Date();
    let res: {follows: Follower[], reblogs: Reblog[], mentions: Reblog[], likes: Reblog[]} = { follows: [], reblogs: [], mentions: [], likes: []};
    const notificaitons: {follows: Follower[], reblogs: Reblog[], mentions: Reblog[], likes: any[]} | undefined = await this.http.get<{follows: Follower[], reblogs: Reblog[], mentions: Reblog[], likes: any[]}>(`${environment.baseUrl}/notifications`, {}).toPromise();
    if(notificaitons) {
      res = notificaitons;
      res.reblogs = res.reblogs.filter((elem) => elem.user.id !== this.jwt.getTokenData().userId );
      const postIds = res.reblogs.map((elem) => elem.id);
      res.reblogs = res.reblogs.filter((elem, index) => postIds.indexOf(elem.id) === index);
      res.reblogs = res.reblogs.sort((a, b) => new Date(b.createdAt).getDate() - new Date(a.createdAt).getDate());
      res.likes = notificaitons.likes.map((elem: any)=> {return {
        user: elem.user,
        content: '',
        id: elem.postId,
        createdAt: elem.createdAt
      }
      })
    }
    return res;
  }

  async getNotificationsScroll(page: number): Promise<{follows: Follower[], reblogs: Reblog[], mentions: Reblog[], likes: Reblog[]}> {
    if(page === 0) {
      this.notificationsScrollTime = new Date();
    }
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('page', page.toString());
    petitionData = petitionData.set('startScroll', this.notificationsScrollTime.getTime().toString());
    const tmp = await this.http.get<{follows: Follower[], reblogs: Reblog[], mentions: Reblog[], likes: any[]}>(`${environment.baseUrl}/notificationsScroll`, {params: petitionData}).toPromise();
    if(tmp){
      tmp.follows = tmp.follows.map((follow) => {return {createdAt: new Date(follow.createdAt), url: follow.url, avatar: follow.avatar }});
      tmp.likes = tmp.likes.map((like)=> {return {user: like.user, content: '', id: like.postId, createdAt: new Date(like.createdAt)}});
      tmp.mentions = tmp.mentions.map((mention)=> {return {user: mention.user, content: '', id: mention.id, createdAt: new Date(mention.createdAt)}});
      tmp.reblogs = tmp.reblogs.map((reblog)=> {return {user: reblog.user, content: '', id: reblog.id, createdAt: new Date(reblog.createdAt)}});
    }
    return tmp ? tmp : { follows: [], reblogs: [], mentions: [], likes: []};
  }

  async markNotificationsRead(): Promise<boolean> {
    let res = false;
    const payload = {
      time: this.lastTimeChecked.getTime().toString()
    }
    const response = await this.http.post(`${environment.baseUrl}/readNotifications`, payload).toPromise();
    if(response) {
      res = true;
    }
    return res;
  }
}
