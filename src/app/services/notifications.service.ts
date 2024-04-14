import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Follower } from '../interfaces/follower';
import { Reblog } from '../interfaces/reblog';
import { JwtService } from './jwt.service';
import { firstValueFrom } from 'rxjs';
import { SimplifiedUser } from '../interfaces/simplified-user';
import { Quote, basicPost } from '../interfaces/unlinked-posts';
import { UserNotifications } from '../interfaces/user-notifications';
import { NotificationType } from '../enums/notification-type';
import { ProcessedPost } from '../interfaces/processed-post';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  likesDate = new Date()
  followsDate = new Date()
  reblogsDate = new Date()
  mentionsDate = new Date()
  emojiReactionDate = new Date()
  quotesDate = new Date()


  constructor(private http: HttpClient, private jwt: JwtService) { }

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
  ): Promise<{
    follows: Follower[];
    reblogs: Reblog[];
    mentions: Reblog[];
    likes: Reblog[];
    emojiReactions: UserNotifications[];
    quotes: Reblog[]
  }> {
    if (!this.jwt.tokenValid()) {
      return {
        follows: [],
        reblogs: [],
        mentions: [],
        likes: [],
        emojiReactions: [],
        quotes: []
      };
    }
    if (page === 0) {
      this.likesDate = new Date()
      this.followsDate = new Date()
      this.reblogsDate = new Date()
      this.mentionsDate = new Date()
      this.emojiReactionDate = new Date()
      this.quotesDate = new Date()
    }
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('likesDate', this.likesDate.toString())
    petitionData = petitionData.set('followsDate', this.followsDate.toString())
    petitionData = petitionData.set('reblogsDate', this.reblogsDate.toString())
    petitionData = petitionData.set('mentionsDate', this.mentionsDate.toString())
    petitionData = petitionData.set('emojiReactionDate', this.emojiReactionDate.toString())
    petitionData = petitionData.set('quotesDate', this.quotesDate.toString())
    petitionData = petitionData.set('page', page)

    const tmp = await firstValueFrom(
      this.http.get<{
        users: SimplifiedUser[],
        posts: basicPost[],
        medias: any[],
        follows: any[],
        reblogs: any[],
        mentions: any[],
        likes: any[],
        emojiReactions: any[],
        quotes: any[]
      }>(`${environment.baseUrl}/v2/notificationsScroll`, {
        params: petitionData,
      })
    );
    if (tmp) {
      tmp.users = tmp.users.map(usr => {
        console.log(usr.url.startsWith('@') ? environment.externalCacheurl + encodeURIComponent(usr.avatar) :
          environment.externalCacheurl + encodeURIComponent(environment.baseMediaUrl + usr.avatar))
        return {
          ...usr,
          avatar: usr.url.startsWith('@') ? environment.externalCacheurl + encodeURIComponent(usr.avatar) :
            environment.externalCacheurl + encodeURIComponent(environment.baseMediaUrl + usr.avatar)
        }
      })

      tmp.posts = tmp.posts.map((post: any) => {
        let user = tmp.users.find(usr => usr.id === post.userId) as SimplifiedUser;
        post.user = user;
        const medias = tmp.medias.filter(med => med.posts[0].id === post.id)
        post.medias = medias;
        return post;
      })
      tmp.posts = tmp.posts.map((post: any) => {
        return {
          ...post,
          quotes: tmp.quotes.filter(q => q.quoterPostId === post.id).map(q => tmp.posts.find(p => p.id === q.quotedPostId) as basicPost)
        }
      })
      tmp.follows = tmp.follows.map((follow) => {
        const usr = tmp.users.find(usr => usr.id === follow.followerId)
        return {
          createdAt: new Date(follow.createdAt),
          url: usr?.url,
          avatar: usr?.avatar,
        };
      });
      tmp.emojiReactions = tmp.emojiReactions.map((emojiReact: any) => {
        const user = tmp.users.find((usr) => usr.id === emojiReact.userId);
        const post = tmp.posts.find(post => post.id === emojiReact.postId);
        return {
          date: new Date(emojiReact.createdAt),
          url: emojiReact.postId,
          userUrl: user?.url,
          avatar: user?.avatar,
          type: NotificationType.EMOJIREACT,
          emojiReact: emojiReact.emoji,
          emojiName: emojiReact.content,
          fragment: post,

        };
      });
      tmp.likes = tmp.likes.map((like) => {
        const usr = tmp.users.find(usr => usr.id === like.userId)
        return {
          user: usr,
          content: tmp.posts.find(post => post.id === like.postId),
          id: like.postId,
          createdAt: new Date(like.createdAt),
        };
      });
      tmp.mentions = tmp.mentions.map((mention) => {
        if (!tmp.users.find((usr) => usr.id === mention.userId)) {
          console.log('USER MISSING: ' + mention.userId + ',' + mention.id);
        }
        const content = tmp.posts.find(post => post.id === mention.id)
        return {
          user: tmp.users.find((usr) => usr.id === mention.userId),
          content: content,
          id: mention.id,
          createdAt: new Date(mention.createdAt),
        };
      });
      tmp.reblogs = tmp.reblogs.map((reblog) => {
        const usr = tmp.users.find((usr) => usr.id === reblog.userId);
        return {
          user: usr,
          content: tmp.posts.find(post => post.id === reblog.parentId),
          id: reblog.id,
          createdAt: new Date(reblog.createdAt),
        };
      });
    }
    tmp.quotes = tmp.quotes.map(q => {
      const post = tmp.posts.find((post: any) => post.id === q.quoterPostId) as basicPost
      const user = tmp.users.find((usr) => usr.id === post.userId) as SimplifiedUser
      return {
        user: user,
        content: post,
        id: post.id,
        createdAt: new Date(post.createdAt)
      }
    })
    if (tmp) {
      this.followsDate = new Date(Math.min.apply(null, tmp.follows.map(elem => elem.createdAt)))
      this.likesDate = new Date(Math.min.apply(null, tmp.likes.map(elem => elem.createdAt)))
      this.reblogsDate = new Date(Math.min.apply(null, tmp.reblogs.map(elem => elem.createdAt)))
      this.mentionsDate = new Date(Math.min.apply(null, tmp.mentions.map(elem => elem.createdAt)))
      this.emojiReactionDate = new Date(Math.min.apply(null, tmp.emojiReactions.map(elem => elem.createdAt)))
      this.quotesDate = new Date(Math.min.apply(null, tmp.quotes.map(elem => elem.createdAt)))
    }
    return tmp
      ? tmp
      : {
        follows: [],
        reblogs: [],
        mentions: [],
        likes: [],
        emojiReactions: [],
        quotes: []
      };
  }
}
