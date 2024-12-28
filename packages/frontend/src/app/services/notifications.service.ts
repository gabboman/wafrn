import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { Follower } from '../interfaces/follower'
import { Reblog } from '../interfaces/reblog'
import { JwtService } from './jwt.service'
import { firstValueFrom } from 'rxjs'
import { SimplifiedUser } from '../interfaces/simplified-user'
import { Quote, basicPost } from '../interfaces/unlinked-posts'
import { UserNotifications } from '../interfaces/user-notifications'
import { NotificationType } from '../enums/notification-type'
import { ProcessedPost } from '../interfaces/processed-post'
import { PostsService } from './posts.service'
import { EnvironmentService } from './environment.service'

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  likesDate = new Date()
  followsDate = new Date()
  reblogsDate = new Date()
  mentionsDate = new Date()
  emojiReactionDate = new Date()
  quotesDate = new Date()

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

  async getNotificationsScroll(page: number): Promise<{
    follows: Follower[]
    reblogs: Reblog[]
    mentions: Reblog[]
    likes: Reblog[]
    emojiReactions: UserNotifications[]
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
      }
    }
    if (page === 0) {
      this.likesDate = new Date()
      this.followsDate = new Date()
      this.reblogsDate = new Date()
      this.mentionsDate = new Date()
      this.emojiReactionDate = new Date()
      this.quotesDate = new Date()
    }
    let petitionData: HttpParams = new HttpParams()
    petitionData = petitionData.set('likesDate', this.likesDate.getTime())
    petitionData = petitionData.set('followsDate', this.followsDate.getTime())
    petitionData = petitionData.set('reblogsDate', this.reblogsDate.getTime())
    petitionData = petitionData.set('mentionsDate', this.mentionsDate.getTime())
    petitionData = petitionData.set('emojiReactionDate', this.emojiReactionDate.getTime())
    petitionData = petitionData.set('quotesDate', this.quotesDate.getTime())
    petitionData = petitionData.set('page', page)

    let tmp = await firstValueFrom(
      this.http.get<{
        users: SimplifiedUser[]
        posts: basicPost[]
        medias: any[]
        follows: any[]
        reblogs: any[]
        mentions: any[]
        likes: any[]
        emojiReactions: any[]
        quotes: any[]
      }>(`${EnvironmentService.environment.baseUrl}/v2/notificationsScroll`, {
        params: petitionData
      })
    )
    if (tmp) {
      tmp.posts = tmp.posts.map((post: any) => {
        const user = tmp.users.find((usr) => usr.id === post.userId) as SimplifiedUser
        post.user = user
        const medias = tmp.medias.filter((med) => med.postId === post.id)
        post.medias = medias
        post.emojis = [] // TODO fix this later
        const mutedWordsRaw = localStorage.getItem('mutedWords')
        let mutedWords: string[] = []
        if (mutedWordsRaw) {
          mutedWords = mutedWordsRaw
            .split(',')
            .map((word) => word.trim())
            .filter((word) => word.length > 0)
        }
        if (mutedWords.length > 0) {
          const cwedWords = mutedWords.filter(
            (word) =>
              post.content.toLowerCase().includes(word.toLowerCase()) ||
              post.medias?.some((media: any) => media.description?.toLowerCase().includes(word.toLowerCase()))
          )
          if (cwedWords.length > 0) {
            post.content_warning = `Post includes muted words: ${cwedWords} ${post.content_warning}`
          }
        }
        return post
      })
      tmp.posts = tmp.posts.map((post: any) => {
        return {
          ...post,
          quotes: tmp.quotes
            .filter((q) => q.quoterPostId === post.id)
            .map((q) => tmp.posts.find((p) => p.id === q.quotedPostId) as basicPost)
        }
      })
      tmp.follows = tmp.follows.map((follow) => {
        const usr = tmp.users.find((usr) => usr.id === follow.followerId)
        return {
          createdAt: new Date(follow.createdAt),
          url: usr?.url,
          avatar: usr?.avatar
        }
      })
      tmp.emojiReactions = tmp.emojiReactions.map((emojiReact: any) => {
        const user = tmp.users.find((usr) => usr.id === emojiReact.userId)
        const post = tmp.posts.find((post) => post.id === emojiReact.postId)
        return {
          date: new Date(emojiReact.createdAt),
          url: emojiReact.postId,
          userUrl: user?.url,
          avatar: user?.avatar,
          type: NotificationType.EMOJIREACT,
          emojiReact: emojiReact.emoji,
          emojiName: emojiReact.content,
          fragment: post
        }
      })
      tmp.likes = tmp.likes.map((like) => {
        const usr = tmp.users.find((usr) => usr.id === like.userId)
        return {
          user: usr,
          content: tmp.posts.find((post) => post.id === like.postId),
          id: like.postId,
          createdAt: new Date(like.createdAt)
        }
      })
      tmp.mentions = tmp.mentions.map((mention) => {
        if (!tmp.users.find((usr) => usr.id === mention.userId)) {
          console.log('USER MISSING: ' + mention.userId + ',' + mention.id)
        }
        const content = tmp.posts.find((post) => post.id === mention.id)
        return {
          user: tmp.users.find((usr) => usr.id === mention.userId),
          content: content,
          id: mention.id,
          createdAt: new Date(mention.createdAt)
        }
      })
      tmp.reblogs = tmp.reblogs.map((reblog) => {
        const usr = tmp.users.find((usr) => usr.id === reblog.userId)
        return {
          user: usr,
          content: tmp.posts.find((post) => post.id === reblog.parentId),
          id: reblog.id,
          createdAt: new Date(reblog.createdAt)
        }
      })
    }
    tmp.quotes = tmp.quotes.map((q) => {
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
      this.followsDate = new Date(
        Math.min.apply(
          null,
          tmp.follows.map((elem) => elem.createdAt)
        )
      )
      this.likesDate = new Date(
        Math.min.apply(
          null,
          tmp.likes.map((elem) => elem.createdAt)
        )
      )
      this.reblogsDate = new Date(
        Math.min.apply(
          null,
          tmp.reblogs.map((elem) => elem.createdAt)
        )
      )
      this.mentionsDate = new Date(
        Math.min.apply(
          null,
          tmp.mentions.map((elem) => elem.createdAt)
        )
      )
      this.emojiReactionDate = new Date(
        Math.min.apply(
          null,
          tmp.emojiReactions.map((elem) => elem.createdAt)
        )
      )
      this.quotesDate = new Date(
        Math.min.apply(
          null,
          tmp.quotes.map((elem) => elem.createdAt)
        )
      )
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
        }
  }
}
