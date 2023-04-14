import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ProcessedPost } from '../interfaces/processed-post';
import { RawPost } from '../interfaces/raw-post';
import { SimplifiedUser } from '../interfaces/simplified-user';
import { PostsService } from './posts.service';
import { Observable } from 'rxjs';
import { map, tap } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  startScrollDate: Date = new Date();
  baseUrl: string;

  constructor(
    private http : HttpClient,
    private postService: PostsService
  ) {
    this.baseUrl = environment.baseUrl;
  }


  getDashboardUrl(level: number): string{
    let res = ''
    switch(level) {
      case 0:
        res =  `${environment.baseUrl}/explore`
        break
      case 1:
        res =  `${environment.baseUrl}/dashboard`
        break
      case 2:
        res =  `${environment.baseUrl}/exploreLocal`
        break
      default:
      res =  `${environment.baseUrl}/private`
    }
    return res;
  }

  async getDashboardPage(page: number, level: number): Promise<ProcessedPost[][]> {
    let result: ProcessedPost[][] = [];
    if(page === 0) {
      //if we are starting the scroll, we store the current date
      this.startScrollDate = new Date();
    }
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('page', page.toString());
    petitionData = petitionData.set('startScroll', this.startScrollDate.getTime().toString());
    const url = this.getDashboardUrl(level);
    let dashboardPetition: Array<RawPost> | undefined = await this.http.get<Array<RawPost>>(url, {params: petitionData}).toPromise();
    if(dashboardPetition) {
      result = dashboardPetition.map(elem => this.postService.processPost(elem));
      result = result.filter(post => !this.postService.postContainsBlocked(post));
    } else {
      // TODO show error message
    }


    return result;

  }


  async getSearchPage(page: number, term: string): Promise<{posts: ProcessedPost[][], users: SimplifiedUser[]}> {
    let postResult: ProcessedPost[][] = [];
    if(page === 0) {
      //if we are starting the scroll, we store the current date
      this.startScrollDate = new Date();
    }
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('page', page.toString());
    petitionData = petitionData.set('startScroll', this.startScrollDate.getTime().toString());
    petitionData = petitionData.set('term', term);
    let dashboardPetition: {posts: Array<RawPost>, users: Array<SimplifiedUser> } | undefined = await this.http.get<{posts: Array<RawPost>, users: Array<SimplifiedUser> }>(`${environment.baseUrl}/search`, {params: petitionData}).toPromise();
    if(dashboardPetition) {
      postResult = dashboardPetition.posts.map(elem => this.postService.processPost(elem));
      postResult = postResult.filter(post => !this.postService.postContainsBlocked(post));

    } else {
      // TODO show error message
    }


    return {posts: postResult, users: dashboardPetition?.users ? dashboardPetition?.users : []};

  }

  async getBlogPage(page: number, blogId: string): Promise<ProcessedPost[][]> {
    let result: ProcessedPost[][] = [];
    if(page === 0) {
      //if we are starting the scroll, we store the current date
      this.startScrollDate = new Date();
    }
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('page', page.toString());
    petitionData = petitionData.set('startScroll', this.startScrollDate.getTime().toString());
    petitionData = petitionData.set('id', blogId);
    let dashboardPetition: Array<RawPost> | undefined = await this.http.get<Array<RawPost>>(`${environment.baseUrl}/blog`, {params: petitionData}).toPromise();
    if(dashboardPetition) {
      result = dashboardPetition.map(elem => this.postService.processPost(elem));
      result = result.filter(post => !this.postService.postContainsBlocked(post));
    } else {
      // TODO show error message
    }


    return result;

  }

  async getBlogDetails(url: string) {
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.append('id', url);
    let res: any = await this.http.get(`${environment.baseUrl}/user`, {params: petitionData}).toPromise();
    if(res.id) {
      return {...res, success: true};
    }
    else {
      return {
        success: false
      }
    }
  }

  getPost(id: string): Observable<ProcessedPost[]> {
    let petition: Observable<RawPost> = this.http.get<RawPost>(`${this.baseUrl}/singlePost/${id}`);
    return petition.pipe(map ((elem: RawPost) => {
      return this.postService.processPost(elem);
    }))
  }

}
