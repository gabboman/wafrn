import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProcessedPost } from '../interfaces/processed-post';
import { RawPost } from '../interfaces/raw-post';
import { MediaService } from './media.service';
import * as sanitizeHtml from 'sanitize-html';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';
import { JwtService } from './jwt.service';
@Injectable({
  providedIn: 'root'
})
export class PostsService {


  wafrnMediaRegex = /\[wafrnmediaid="[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}"\]/gm;
  wafrnMentionRegex = /\[mentionuserid="[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}"\]/gm;
  uuidRegex = /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/;
  youtubeRegex = /(?:https?:)?(?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube(?:\-nocookie)?\.(?:[A-Za-z]{2,4}|[A-Za-z]{2,3}\.[A-Za-z]{2})\/)(?:watch|embed\/|vi?\/)*(?:\?[\w=&]*vi?=)?([^#&\?\/]{11}).*?/g;
  public updateFollowers: BehaviorSubject<Boolean> = new BehaviorSubject(new Boolean());

  public followedUserIds: Array<String> = [];
  public blockedUserIds: Array<string> = [];
  constructor(
    private mediaService: MediaService,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private jwtService: JwtService
  ) {
    this.loadFollowers();
  }


  async loadFollowers() {
    if(this.jwtService.tokenValid()) {
      let followsAndBlocks = await this.http.get<{
        followedUsers: string[],
        blockedUsers: string[]
      }>(environment.baseUrl + '/getFollowedUsers').toPromise()
      if (followsAndBlocks) {
        this.followedUserIds = followsAndBlocks.followedUsers;
        this.blockedUserIds = followsAndBlocks.blockedUsers;
        this.updateFollowers.next(true);
      }
    }
  }

  async followUser(id: string): Promise<boolean> {
    let res = false;
    let payload = new FormData();
    payload.append('userId', id);
    try {
      let response = await this.http.post<{ success: boolean }>(environment.baseUrl + '/follow', payload).toPromise();
      await this.loadFollowers();
      res = response?.success === true;
    } catch (exception) {
      console.log(exception)
    }

    return res;
  }

  async unfollowUser(id: string): Promise<boolean> {
    let res = false;
    let payload = new FormData();
    payload.append('userId', id);
    try {
      let response = await this.http.post<{ success: boolean }>(environment.baseUrl + '/unfollow', payload).toPromise();
      await this.loadFollowers();
      res = response?.success === true;
    } catch (exception) {
      console.log(exception)
    }

    return res;
  }

  async getDetails(id: string): Promise<number> {
    let res = 0;
    let payload = new FormData();
    payload.append('id', id);
    try {
      let response = await this.http.post<{ reblogs: number }>(environment.baseUrl + '/postDetails', payload).toPromise();
      if (response?.reblogs) {
        res = response.reblogs;
      }
    } catch (exception) {
      console.log(exception)
    }

    return res;
  }

  processPost(rawPost: RawPost): ProcessedPost[] {
    let result: ProcessedPost[] = [];
    if (rawPost.ancestors) {
      rawPost.ancestors.forEach((post: RawPost) => {
        result.push(post);
      });
      result = result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      result.push(rawPost);
    }
    result.forEach(val => {
      this.mediaService.addMediaToMap(val);
    });
    return result;
  }


  getPostHtml(content: string): string {
    const replacementsWafrnMedia: Array<{ wafrnMediaStringToReplace: string, id: string }> = [];
    const replacementsWafrnMentions: Array<{ wafrnMentionstringToReplace: string, url: string }> = [];

    let sanitized = sanitizeHtml(content, { allowedTags: ['b', 'i', 'u', 'a','s', 'span', 'br', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'strong', 'em', 'ul', 'li'] });
    // we remove stuff like img and script tags. we only allow certain stuff.
    const youtubeLinks = sanitized.matchAll(this.youtubeRegex);

    if (youtubeLinks) {
      Array.from(youtubeLinks).forEach(youtubeString => {
        // some exception, like when its on a href or stuff
            const newString = '<app-wafrn-youtube-player video="' + youtubeString[1] + '"></app-wafrn-youtube-player>';
            sanitized = sanitized.replace(youtubeString[0], newString);
        });
      }
    


    sanitized.match(this.wafrnMediaRegex)?.forEach((media) => {
      let id = '0';
      const uuid = media.match(this.uuidRegex);
      if (uuid) {
        id = uuid[0]
      }
      replacementsWafrnMedia.push({ wafrnMediaStringToReplace: media, id: id });
    });

    sanitized.match(this.wafrnMentionRegex)?.forEach((mention) => {
      let id = '0';
      const uuid = mention.match(this.uuidRegex);
      if (uuid) {
        id = uuid[0]
      }
      replacementsWafrnMentions.push({ wafrnMentionstringToReplace: mention, url: this.mediaService.mentionsMap[id]?.user.url });
    });
    replacementsWafrnMedia.forEach(replacement => {
      const replacementString = '<app-wafrn-media id="' + replacement.id + '" > </app-wafrn-media>'
      sanitized = sanitized.replace(replacement.wafrnMediaStringToReplace, replacementString);
    });

    replacementsWafrnMentions.forEach(replacement => {
      const replacementString = '<a href="/blog/' + replacement.url + '" >@' + replacement.url +'</a>'
      sanitized = sanitized.replace(replacement.wafrnMentionstringToReplace, replacement.url ? replacementString: '_error_in_mention_');
    });


    return sanitized;

  }

  postContainsBlocked(processedPost: ProcessedPost[]): boolean {
    let res = false;
    processedPost.forEach(fragment => {
      if (
        this.blockedUserIds.indexOf(fragment.userId) != -1
      ) {
        res = true;
      }
    })
    return res;
  }
}
