import { Injectable } from '@angular/core';
import { ProcessedPost } from '../interfaces/processed-post';
import { RawPost } from '../interfaces/raw-post';
import { MediaService } from './media.service';
import { sanitize } from 'dompurify';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { JwtService } from './jwt.service';
import { unlinkedPosts } from '../interfaces/unlinked-posts';
import { SimplifiedUser } from '../interfaces/simplified-user';
import { UserOptions } from '../interfaces/userOptions';
@Injectable({
  providedIn: 'root',
})
export class PostsService {
  parser = new DOMParser();
  wafrnMediaRegex =
    /\[wafrnmediaid="[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}"\]/gm;
  youtubeRegex =
    /((?:https?:\/\/)?(www.|m.)?(youtube(\-nocookie)?\.com|youtu\.be)\/(v\/|watch\?v=|embed\/)?([\S]{11}))([^\S]|\?[\S]*|\&[\S]*|\b)/g;
  public updateFollowers: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public followedUserIds: Array<string> = [];
  public notYetAcceptedFollowedUsersIds: Array<string> = [];
  public blockedUserIds: Array<string> = [];
  constructor(
    private mediaService: MediaService,
    private http: HttpClient,
    private jwtService: JwtService
  ) {
    this.loadFollowers();
  }

  async loadFollowers() {
    if (this.jwtService.tokenValid()) {
      const followsAndBlocks = await firstValueFrom(
        this.http.get<{
          followedUsers: string[];
          blockedUsers: string[];
          notAcceptedFollows: string[];
          options: UserOptions[];
        }>(`${environment.baseUrl}/getFollowedUsers`)
      );
      if (followsAndBlocks) {
        this.followedUserIds = followsAndBlocks.followedUsers;
        this.blockedUserIds = followsAndBlocks.blockedUsers;
        this.notYetAcceptedFollowedUsersIds =
          followsAndBlocks.notAcceptedFollows;
        this.updateFollowers.next(true);
        // Here we check user options
        if (followsAndBlocks.options?.length > 0) {
          // frontend options start with wafrn.
          const options = followsAndBlocks.options;
          options
            .filter((option) => option.optionName.startsWith('wafrn.'))
            .forEach((option) => {
              localStorage.setItem(
                option.optionName.split('wafrn.')[1],
                option.optionValue
              );
            });
        }
      }
    }
  }

  async followUser(id: string): Promise<boolean> {
    let res = false;
    const payload = {
      userId: id,
    };
    try {
      const response = await this.http
        .post<{ success: boolean }>(`${environment.baseUrl}/follow`, payload)
        .toPromise();
      await this.loadFollowers();
      res = response?.success === true;
    } catch (exception) {
      console.log(exception);
    }

    return res;
  }

  async unfollowUser(id: string): Promise<boolean> {
    let res = false;
    const payload = {
      userId: id,
    };
    try {
      const response = await this.http
        .post<{ success: boolean }>(`${environment.baseUrl}/unfollow`, payload)
        .toPromise();
      await this.loadFollowers();
      res = response?.success === true;
    } catch (exception) {
      console.log(exception);
    }

    return res;
  }

  async likePost(id: string): Promise<boolean> {
    let res = false;
    const payload = {
      postId: id,
    };
    try {
      const response = await this.http
        .post<{ success: boolean }>(`${environment.baseUrl}/like`, payload)
        .toPromise();
      await this.loadFollowers();
      res = response?.success === true;
    } catch (exception) {
      console.log(exception);
    }

    return res;
  }

  async unlikePost(id: string): Promise<boolean> {
    let res = false;
    const payload = {
      postId: id,
    };
    try {
      const response = await this.http
        .post<{ success: boolean }>(`${environment.baseUrl}/unlike`, payload)
        .toPromise();
      await this.loadFollowers();
      res = response?.success === true;
    } catch (exception) {
      console.log(exception);
    }

    return res;
  }

  processPostNew(unlinked: unlinkedPosts): ProcessedPost[][] {
    const res = unlinked.posts.map((elem) => {
      const processed = elem.ancestors
        ? elem.ancestors.map((anc) =>
            this.processSinglePost({ ...unlinked, posts: [anc] })
          )
        : [];
      processed.push(
        this.processSinglePost({
          ...unlinked,
          posts: [elem],
        })
      );
      return processed.sort((a, b) => {
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    });
    return res.sort((a, b) => {
      return (
        b[b.length - 1].createdAt.getTime() -
        a[a.length - 1].createdAt.getTime()
      );
    });
  }

  processSinglePost(unlinked: unlinkedPosts): ProcessedPost {
    const elem = unlinked.posts[0];
    const user = unlinked.users.find((usr) => usr.id === elem.userId);
    const userEmojis = unlinked.emojiRelations.userEmojiRelation.filter(
      (elem) => elem.userId === user?.id
    );
    const polls = unlinked.polls.filter((poll) => poll.postId === elem.id);
    const medias = unlinked.medias.filter((media) => {
      return media.posts.some(
        (thing) => thing.postMediaRelations.postId === elem.id
      );
    });
    if (userEmojis && userEmojis.length && user?.name) {
      userEmojis.forEach((usrEmoji) => {
        const emoji = unlinked.emojiRelations.emojis.find(
          (emojis) => emojis.id === usrEmoji.emojiId
        );
        if (emoji) {
          user.name = user.name.replaceAll(
            emoji.name,
            `<img class="post-emoji" src="${
              environment.externalCacheurl + encodeURIComponent(emoji.url)
            }">`
          );
        }
      });
    }
    const nonExistentUser = {
      avatar: '',
      url: 'ERROR',
      name: 'ERROR',
      id: '42',
    };
    const mentionedUsers = unlinked.mentions
      .filter((mention) => mention.post === elem.id)
      .map((mention) =>
        unlinked.users.find((usr) => usr.id === mention.userMentioned)
      )
      .filter((mention) => mention !== undefined);
    const newPost: ProcessedPost = {
      ...elem,
      user: user ? user : nonExistentUser,
      tags: unlinked.tags.filter((tag) => tag.postId === elem.id),
      descendents: [],
      userLikesPostRelations: unlinked.likes
        .filter((like) => like.postId === elem.id)
        .map((like) => like.userId),
      emojis: unlinked.emojiRelations.emojis,
      createdAt: new Date(elem.createdAt),
      updatedAt: new Date(elem.updatedAt),
      notes: elem.notes ? elem.notes : 0,
      remotePostId: elem.remotePostId
        ? elem.remotePostId
        : `${environment.frontUrl}/post/${elem.id}`,
      medias: medias.sort((a, b) => a.order - b.order),
      questionPoll: polls[0],
      mentionPost: mentionedUsers as SimplifiedUser[],
    };
    newPost.content = this.getPostHtml(newPost);
    return newPost;
  }

  processPost(rawPost: RawPost): ProcessedPost[] {
    let result: ProcessedPost[] = [];
    const notes = rawPost.notes;
    if (rawPost.ancestors) {
      rawPost.ancestors.forEach((post: RawPost) => {
        result.push({
          ...post,
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.updatedAt),
          tags: post.postTags,
          remotePostId: post.remotePostId
            ? post.remotePostId
            : `${environment.frontUrl}/post/${post.id}`,
          userLikesPostRelations: post.userLikesPostRelations.map(
            (elem) => elem.userId
          ),
          notes: notes,
          descendents: [],
        });
      });
      result = result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      result.push({
        ...rawPost,
        tags: rawPost.postTags,
        userLikesPostRelations: rawPost.userLikesPostRelations.map(
          (elem) => elem.userId
        ),
        remotePostId: rawPost.remotePostId
          ? rawPost.remotePostId
          : `${environment.frontUrl}/post/${rawPost.id}`,
        notes: notes,
        descendents: [],
      });
    }
    if (rawPost.descendents) {
      result[result.length - 1].descendents = rawPost.descendents
        .map((elem) => {
          elem.user.avatar = elem.user.url.startsWith('@')
            ? environment.externalCacheurl + encodeURI(elem.user.avatar)
            : environment.baseMediaUrl + elem.user.avatar;
          elem.createdAt = new Date(elem.createdAt);
          elem.updatedAt = new Date(elem.updatedAt);
          return elem;
        })
        .sort(
          (a: RawPost, b: RawPost) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    result = result.filter(
      (elem, index) => elem.content != '' || index === result.length - 1
    );
    return result.map((elem) => {
      elem.user.name = elem.user.name ? elem.user.name : '';
      elem.user.emojis?.forEach((emoji) => {
        elem.user.name = elem.user.name.replaceAll(
          emoji.name,
          `<img class="post-emoji" src="${
            environment.externalCacheurl + encodeURIComponent(emoji.url)
          }">`
        );
      });
      elem.content = this.getPostHtml(elem);
      elem.createdAt = new Date(elem.createdAt);
      elem.updatedAt = new Date(elem.updatedAt);
      return elem;
    });
  }

  getPostHtml(post: ProcessedPost): string {
    const content = post.content;
    let sanitized = sanitize(content, {
      ALLOWED_TAGS: [
        'b',
        'i',
        'u',
        'a',
        's',
        'del',
        'span',
        'br',
        'p',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'pre',
        'strong',
        'em',
        'ul',
        'li',
        'marquee',
        'font',
        'blockquote',
      ],
      ALLOWED_ATTR: ['style', 'class', 'href', 'color'],
    });
    // we remove stuff like img and script tags. we only allow certain stuff.
    const parsedAsHTML = this.parser.parseFromString(sanitized, 'text/html');
    const links = parsedAsHTML.getElementsByTagName('a');
    const mentionedRemoteIds = post.mentionPost
      ? post.mentionPost?.map((elem) => elem.remoteId)
      : [];
    const mentionRemoteUrls = post.mentionPost
      ? post.mentionPost?.map((elem) => elem.url)
      : [];
    const mentionedHosts = post.mentionPost
      ? post.mentionPost?.map(
          (elem) =>
            this.getURL(
              elem.remoteId
                ? elem.remoteId
                : 'https://adomainthatdoesnotexist.google.com'
            ).hostname
        )
      : [];
    Array.from(links).forEach((link) => {
      const youtubeMatch = link.href.matchAll(this.youtubeRegex);
      if (link.innerText === link.href && youtubeMatch) {
        Array.from(youtubeMatch).forEach((youtubeString) => {
          link.innerHTML = `  <div class="watermark"><!-- Watermark container --><div class="watermark__inner"><!-- The watermark --><div class="watermark__body"><img alt="youtube logo" class="yt-watermark" loading="lazy" src="/assets/img/youtube_logo.png"></div></div><img class="yt-thumbnail" src="${
            environment.externalCacheurl +
            encodeURIComponent(
              `https://img.youtube.com/vi/${youtubeString[6]}/hqdefault.jpg`
            )
          }" loading="lazy" alt="Thumbnail for video"></div>`;
        });
      }
      // replace mentioned users with wafrn version of profile.
      // TODO not all software links to mentionedProfile
      if (mentionedRemoteIds.includes(link.href)) {
        if (post.mentionPost) {
          const mentionedUser = post.mentionPost.find(
            (elem) => elem.remoteId === link.href
          );
          if (mentionedUser) {
            link.href = `${environment.frontUrl}/blog/${mentionedUser.url}`;
          }
        }
      }
      const linkAsUrl: URL = this.getURL(link.href);
      if (mentionedHosts.includes(linkAsUrl.hostname)) {
        const sanitizedContent = sanitize(link.innerHTML, {
          ALLOWED_TAGS: [],
        });
        if (
          sanitizedContent.startsWith('@') &&
          mentionRemoteUrls.includes(
            `${sanitizedContent}@${linkAsUrl.hostname}`
          )
        ) {
          link.href = `/blog/${sanitizedContent}@${linkAsUrl.hostname}`;
        }
        if (
          sanitizedContent.startsWith('@') &&
          mentionRemoteUrls.includes(`${sanitizedContent}`)
        ) {
          link.href = `/blog/${sanitizedContent}`;
        }
      }
      link.target = '_blank';
      sanitized = parsedAsHTML.documentElement.innerHTML;
    });

    sanitized = sanitized.replaceAll(this.wafrnMediaRegex, '');

    post.emojis.forEach((emoji) => {
      console.log(emoji);
      const strToReplace = emoji.name.startsWith(':')
        ? emoji.name
        : `:${emoji.name}:`;
      sanitized = sanitized.replaceAll(
        strToReplace,
        `<img src="${
          environment.externalCacheurl + encodeURIComponent(emoji.url)
        }" class="post-emoji"/>`
      );
    });

    return sanitized;
  }

  postContainsBlocked(processedPost: ProcessedPost[]): boolean {
    let res = false;
    processedPost.forEach((fragment) => {
      if (this.blockedUserIds.includes(fragment.userId)) {
        res = true;
      }
    });
    return res;
  }

  getPostContentSanitized(content: string): string {
    return sanitize(content);
  }

  async loadRepliesFromFediverse(id: string) {
    return await this.http
      .get(`${environment.baseUrl}/loadRemoteResponses?id=${id}`)
      .toPromise();
  }

  getURL(urlString: string): URL {
    let res = new URL(environment.frontUrl);
    try {
      res = new URL(urlString);
    } catch (error) {
      console.log('Invalid url: ' + urlString);
    }
    return res;
  }

  async getDescendents(id: string): Promise<{ descendents: RawPost[] }> {
    const response = await firstValueFrom(
      this.http.get<unlinkedPosts>(
        environment.baseUrl + '/v2/descendents/' + id
      )
    );
    const res: { descendents: RawPost[] } = { descendents: [] };
    if (response) {
      const emptyUser: SimplifiedUser = {
        id: '42',
        url: 'ERROR_GETTING_USER',
        avatar: '',
        name: 'ERROR',
      };
      res.descendents = response.posts
        .map((elem) => {
          const user = response.users.find((usr) => usr.id === elem.userId);
          if (user) {
            user.avatar = user.url.startsWith('@')
              ? environment.externalCacheurl + encodeURIComponent(user.avatar)
              : environment.externalCacheurl +
                encodeURIComponent(environment.baseMediaUrl + user.avatar);
          }
          return {
            id: elem.id,
            content: elem.len ? 'A' : '', // HACK I know this is ugly but because legacy reasons reblogs are empty posts
            user: user ? user : emptyUser,
            content_warning: '',
            createdAt: new Date(elem.createdAt),
            updatedAt: new Date(elem.updatedAt),
            userId: elem.userId,
            hierarchyLevel: 69, // yeah I know
            postTags: [],
            privacy: elem.privacy,
            notes: 69,
            userLikesPostRelations: [],
            emojis: [],
          };
        })
        .sort((b, a) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    return res;
  }
}
