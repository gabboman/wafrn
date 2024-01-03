import { HttpClient, HttpParams } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ProcessedPost } from '../interfaces/processed-post';
import { RawPost } from '../interfaces/raw-post';
import { SimplifiedUser } from '../interfaces/simplified-user';
import { PostsService } from './posts.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MessageService } from './message.service';

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

  getDashboardUrl(level: number): string {
    let res = '';
    switch (level) {
      case 0:
        res = `${environment.baseUrl}/explore`;
        break;
      case 1:
        res = `${environment.baseUrl}/dashboard`;
        break;
      case 2:
        res = `${environment.baseUrl}/exploreLocal`;
        break;
      default:
        res = `${environment.baseUrl}/private`;
    }
    return res;
  }

  async getDashboardPage(
    date: Date,
    level: number
  ): Promise<ProcessedPost[][]> {
    let result: ProcessedPost[][] = [];
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('page', '0');
    petitionData = petitionData.set('startScroll', date.getTime().toString());
    const url = this.getDashboardUrl(level);
    const dashboardPetition: Array<RawPost> | undefined = await this.http
      .get<Array<RawPost>>(url, { params: petitionData })
      .toPromise();
    if (dashboardPetition) {
      result = dashboardPetition.map((elem) =>
        this.postService.processPost(elem)
      );
      result = result.filter(
        (post) => !this.postService.postContainsBlocked(post)
      );
    } else {
      // TODO show error message
    }

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
    const dashboardPetition:
      | { posts: Array<RawPost>; users: Array<SimplifiedUser> }
      | undefined = await this.http
      .get<{ posts: Array<RawPost>; users: Array<SimplifiedUser> }>(
        `${environment.baseUrl}/search`,
        { params: petitionData }
      )
      .toPromise();
    if (dashboardPetition) {
      postResult = dashboardPetition.posts.map((elem) =>
        this.postService.processPost(elem)
      );
      postResult = postResult.filter(
        (post) => !this.postService.postContainsBlocked(post)
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
      users: dashboardPetition?.users ? dashboardPetition?.users : [],
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
    const dashboardPetition: Array<RawPost> | undefined = await this.http
      .get<Array<RawPost>>(`${environment.baseUrl}/blog`, {
        params: petitionData,
      })
      .toPromise();
    if (dashboardPetition) {
      result = dashboardPetition.map((elem) =>
        this.postService.processPost(elem)
      );
      result = result.filter(
        (post) => !this.postService.postContainsBlocked(post)
      );
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Something went wrong :(',
      });
    }

    return result;
  }

  async getBlogDetails(url: string) {
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.append('id', url);
    const res: any = await this.http
      .get(`${environment.baseUrl}/user`, { params: petitionData })
      .toPromise();
    if (res.id) {
      return { ...res, success: true };
    } else {
      return {
        success: false,
      };
    }
  }

  getPost(id: string): Observable<ProcessedPost[]> {
    const petition: Observable<RawPost> = this.http.get<RawPost>(
      `${this.baseUrl}/singlePost/${id}`
    );
    return petition.pipe(
      map((elem: RawPost) => {
        return this.postService.processPost(elem);
      })
    );
  }
}
