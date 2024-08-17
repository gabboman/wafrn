import { HttpClient, HttpParams } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ProcessedPost } from '../interfaces/processed-post';
import { SimplifiedUser } from '../interfaces/simplified-user';
import { PostsService } from './posts.service';
import { MessageService } from './message.service';
import { firstValueFrom } from 'rxjs';
import { unlinkedPosts } from '../interfaces/unlinked-posts';
import { Emoji } from '../interfaces/emoji';
import { BlogDetails } from '../interfaces/blogDetails';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  public scrollEventEmitter: EventEmitter<string> = new EventEmitter();
  // TODO improve this. will require some changes for stuff but basically
  // its faster to say "gimme page 0 startdate this" than "gime page 2 startdate this"
  startScrollDate: Date = new Date();
  baseUrl: string;

  constructor(
    private http: HttpClient,
    private postService: PostsService,
    private messageService: MessageService
  ) {
    this.baseUrl = environment.baseUrl;
  }

  async getDashboardPage(
    date: Date,
    level: number
  ): Promise<ProcessedPost[][]> {
    this.postService.loadFollowers();
    let result: ProcessedPost[][] = [];
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('page', '0');
    petitionData = petitionData.set('level', level);
    petitionData = petitionData.set('startScroll', date.getTime().toString());
    const url = `${environment.baseUrl}/v2/dashboard`;
    const dashboardPetition = await firstValueFrom(
      this.http.get<unlinkedPosts>(url, {
        params: petitionData,
      })
    );
    result = this.postService.processPostNew(dashboardPetition);
    result = result.filter(
      (post) => !this.postService.postContainsBlockedOrMuted(post, true)
    );
    this.postService.rewootedPosts = this.postService.rewootedPosts.concat(dashboardPetition.rewootIds)
    this.scrollEventEmitter.emit('scrollingtime');
    return result;
  }

  async getSearchPage(
    page: number,
    term: string
  ): Promise<{ posts: ProcessedPost[][]; users: SimplifiedUser[] }> {
    let postResult: ProcessedPost[][] = [];
    if (page === 0) {
      //if we are starting the scroll, we store the current date
      this.startScrollDate = new Date();
    }
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('page', page.toString());
    petitionData = petitionData.set(
      'startScroll',
      this.startScrollDate.getTime().toString()
    );
    petitionData = petitionData.set('term', term);
    const dashboardPetition: {
      posts: unlinkedPosts;
      foundUsers: Array<SimplifiedUser>;
    } = await firstValueFrom(
      this.http.get<{
        posts: unlinkedPosts;
        foundUsers: Array<SimplifiedUser>;
      }>(`${environment.baseUrl}/v2/search`, { params: petitionData })
    );
    if (dashboardPetition) {
      postResult = this.postService.processPostNew(dashboardPetition.posts);
      postResult = postResult.filter(
        (post) => !this.postService.postContainsBlockedOrMuted(post, false)
      );
    } else {
      // TODO show error message
      this.messageService.add({
        severity: 'error',
        summary: 'Something went wrong :(',
      });
    }

    return {
      posts: postResult,
      users: dashboardPetition?.foundUsers ? dashboardPetition?.foundUsers : [],
    };
  }

  async getBlogPage(page: number, blogId: string): Promise<ProcessedPost[][]> {
    let result: ProcessedPost[][] = [];
    if (page === 0) {
      //if we are starting the scroll, we store the current date
      this.startScrollDate = new Date();
    }
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('page', page.toString());
    petitionData = petitionData.set(
      'startScroll',
      this.startScrollDate.getTime().toString()
    );
    petitionData = petitionData.set('id', blogId);
    const dashboardPetition: unlinkedPosts = await firstValueFrom(
      this.http.get<unlinkedPosts>(`${environment.baseUrl}/v2/blog`, {
        params: petitionData,
      })
    );
    if (dashboardPetition) {
      result = this.postService.processPostNew(dashboardPetition);
      this.startScrollDate = new Date(
        Math.min(
          ...result.map((elem) =>
            new Date(elem[elem.length - 1].createdAt).getTime()
          )
        ) - 1
      );
      if (result.length === 0) {
        this.startScrollDate = new Date(0);
      }
      result = result.filter(
        (post) => !this.postService.postContainsBlockedOrMuted(post, false)
      );
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Something went wrong :(',
      });
    }

    return result;
  }

  async getBlogDetails(url: string, ignoreEmojis = false) {
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.append('id', url);
    const res: BlogDetails = await firstValueFrom(this.http.get<BlogDetails>(`${environment.baseUrl}/user`, { params: petitionData }));
    if (res.emojis && !ignoreEmojis) {
      res.emojis.forEach((emoji: Emoji) => {
        res.name = res.name.replaceAll(emoji.name, this.postService.emojiToHtml(emoji))
        res.description = res.description.replaceAll(emoji.name, this.postService.emojiToHtml(emoji))
      })
    }
    return res;

  }

  async getPostV2(id: string): Promise<ProcessedPost[]> {
    const petition = await firstValueFrom(
      this.http.get<unlinkedPosts>(`${this.baseUrl}/v2/post/${id}`)
    );

    const result = this.postService.processPostNew(petition);

    return result[0];
  }
}
