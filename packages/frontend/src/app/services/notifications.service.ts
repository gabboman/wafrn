import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { Follower } from '../interfaces/follower'
import { Reblog } from '../interfaces/reblog'
import { JwtService } from './jwt.service'
import { firstValueFrom } from 'rxjs'
import { SimplifiedUser } from '../interfaces/simplified-user'
import { EmojiRelations, Media, NotificationRaw, Quote, Tag, basicPost } from '../interfaces/unlinked-posts'
import { UserNotifications } from '../interfaces/user-notifications'
import { ProcessedPost } from '../interfaces/processed-post'
import { PostsService } from './posts.service'
import { EnvironmentService } from './environment.service'
import { Emoji } from '../interfaces/emoji'
import { Ask } from '../interfaces/ask'
import sanitize from 'sanitize-html'

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  uniqueDate = new Date()
  likesDate = new Date()
  followsDate = new Date()
  reblogsDate = new Date()
  mentionsDate = new Date()
  emojiReactionDate = new Date()
  quotesDate = new Date()

  emojiMap = new Map<string, Emoji>()
  userMap = new Map<string, SimplifiedUser>()
  postMap = new Map<string, ProcessedPost>()

  constructor(
    private http: HttpClient,
    private jwt: JwtService,
    private postService: PostsService
  ) {}

  async getUnseenNotifications(): Promise<{
    notifications: number
    reports: number
    usersAwaitingApproval: number
    followsAwaitingApproval: number
    asks: number
  }> {
    let res: {
      notifications: number
      reports: number
      usersAwaitingApproval: number
      followsAwaitingApproval: number
      asks: number
    } = {
      notifications: 0,
      reports: 0,
      followsAwaitingApproval: 0,
      usersAwaitingApproval: 0,
      asks: 0
    }
    try {
      const lastTimeCheckedString = localStorage.getItem('lastTimeCheckNotifications')
      const lastTimeChecked = lastTimeCheckedString ? new Date(lastTimeCheckedString) : new Date(1)
      let petitionData: HttpParams = new HttpParams()
      petitionData = petitionData.set('startScroll', lastTimeChecked.getTime().toString())
      const notifications = await firstValueFrom(
        this.http.get<{
          notifications: number
          reports: number
          usersAwaitingApproval: number
          followsAwaitingApproval: number
          asks: number
        }>(`${EnvironmentService.environment.baseUrl}/v2/notificationsCount`, {
          params: petitionData
        })
      )
      res = notifications ? notifications : res
    } catch (error) {
      console.warn({
        message: 'error processing notifications',
        error: error
      })
    }

    return res
  }

  async getNotificationsScrollV2(page: number): Promise<UserNotifications[]> {
    if (!this.jwt.tokenValid()) {
      return []
    }
    if (page === 0) {
      this.uniqueDate = new Date()
    }
    let petitionData: HttpParams = new HttpParams()
    petitionData = petitionData.set('date', this.uniqueDate.getTime())
    petitionData = petitionData.set('page', page)
    const petition = await firstValueFrom(
      this.http.get<{
        users: SimplifiedUser[]
        posts: basicPost[]
        medias: Media[]
        asks: Ask[]
        tags: Tag[]
        emojiRelations: EmojiRelations
        notifications: NotificationRaw[]
      }>(`${EnvironmentService.environment.baseUrl}/v3/notificationsScroll`, {
        params: petitionData
      })
    )
    if (petition) {
      if (petition.notifications.length) {
        this.uniqueDate = new Date(petition.notifications[petition.notifications.length - 1].createdAt)
      } else {
        this.uniqueDate = new Date(0)
      }
      const processed = this.postService.processPostNew({
        posts: petition.posts,
        emojiRelations: petition.emojiRelations,
        mentions: [],
        users: petition.users,
        polls: [],
        medias: petition.medias,
        tags: petition.tags,
        likes: [],
        quotes: [],
        quotedPosts: [],
        rewootIds: []
      })
      let users = petition.users
      petition.emojiRelations.emojis.forEach((emoji) => {
        this.emojiMap.set(emoji.id, emoji)
      })
      users.forEach((usr) => {
        const userEmojis = petition.emojiRelations.userEmojiRelation
          .filter((emojiRelation) => emojiRelation.userId === usr.id)
          .map((elem) => this.emojiMap.get(elem.emojiId))
        usr.name = sanitize(usr.name, {
          allowedTags: []
        })
        userEmojis.forEach((elem) => {
          if (elem) {
            usr.name = usr.name.replaceAll(elem.name, this.postService.emojiToHtml(elem))
          }
        })
        this.userMap.set(usr.id, usr)
      })
      processed.flat().forEach((post) => {
        this.postMap.set(post.id, post)
      })
      let res: UserNotifications[] = petition.notifications.map((notification) => {
        const usr = this.userMap.get(notification.userId) as SimplifiedUser
        const emoji = notification.emojiReactionId
          ? this.emojiMap.get(
              petition.emojiRelations.postEmojiReactions.find((elem) => elem.id == notification.emojiReactionId)
                ?.emojiId as string
            )
          : undefined
        let notificationProcessed: UserNotifications = {
          type: notification.notificationType,
          url: notification.notificationType === 'FOLLOW' ? `/blog/` : ``,
          avatar: usr.avatar,
          userUrl: usr.url,
          userName: usr.name,
          date: new Date(notification.createdAt),
          fragment: notification.postId ? this.postMap.get(notification.postId) : undefined,
          emojiReact: emoji,
          emojiName: emoji?.name
        }
        return notificationProcessed
      })
      return res
    } else {
      return []
    }
  }

  reblogToNotificationV2(
    reblog: any,
    type: 'MENTION' | 'LIKE' | 'EMOJIREACT' | 'REWOOT' | 'QUOTE' | 'FOLLOW'
  ): UserNotifications {
    let post = this.postMap.get(reblog.postId ? reblog.postId : reblog.quoterPostId) as ProcessedPost
    const user = this.userMap.get(reblog.userId ? reblog.userId : post.userId) as SimplifiedUser
    const emoji = this.emojiMap.get(reblog.emojiId)
    if (!post) {
      if (reblog.id) {
        post = this.postMap.get(reblog.id) as ProcessedPost
      }
    }
    if (type === 'REWOOT') {
      post = this.postMap.get(post.parentId as string) as ProcessedPost
    }
    return {
      url: `/fediverse/post/${post.id}`,
      avatar: user.avatar,
      date: new Date(reblog.createdAt),
      type: type,
      userUrl: user.url,
      fragment: post,
      emojiName: reblog.emojiName,
      emojiReact: emoji,
      userName: post.user.name
    }
  }
}
