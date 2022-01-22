import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ProcessedPost } from '../interfaces/processed-post';
import { RawPost } from '../interfaces/raw-post';
import { SimplifiedUser } from '../interfaces/simplified-user';
import { PostsService } from './posts.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  startScrollDate: Date = new Date();

  constructor(
    private http : HttpClient,
    private postService: PostsService
  ) { }


  async getDashboardPage(page: number, explore: boolean): Promise<ProcessedPost[][]> {
    let result: ProcessedPost[][] = [];
    if(page === 0) {
      //if we are starting the scroll, we store the current date
      this.startScrollDate = new Date();
    }
    let petitionData: FormData = new FormData();
    petitionData.append('page', page.toString());
    petitionData.append('startScroll', this.startScrollDate.getTime().toString());
    const url = explore ? environment.baseUrl + '/explore' : environment.baseUrl + '/dashboard' 
    let dashboardPetition: Array<RawPost> | undefined = await this.http.post<Array<RawPost>>(url, petitionData).toPromise();
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
    let petitionData: FormData = new FormData();
    petitionData.append('page', page.toString());
    petitionData.append('startScroll', this.startScrollDate.getTime().toString());
    petitionData.append('term', term);
    let dashboardPetition: {posts: Array<RawPost>, users: Array<SimplifiedUser> } | undefined = await this.http.post<{posts: Array<RawPost>, users: Array<SimplifiedUser> }>(environment.baseUrl + '/search', petitionData).toPromise();
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
    let petitionData: FormData = new FormData();
    petitionData.append('page', page.toString());
    petitionData.append('startScroll', this.startScrollDate.getTime().toString());
    petitionData.append('id', blogId);
    let dashboardPetition: Array<RawPost> | undefined = await this.http.post<Array<RawPost>>(environment.baseUrl + '/blog', petitionData).toPromise();
    if(dashboardPetition) {
      result = dashboardPetition.map(elem => this.postService.processPost(elem));
      result = result.filter(post => !this.postService.postContainsBlocked(post));
    } else {
      // TODO show error message
    }


    return result;

  }

  async getBlogDetails(url: string) {
    let petitionData: FormData = new FormData();
    petitionData.append('id', url);
    let res: any = await this.http.post(environment.baseUrl + '/userDetails', petitionData).toPromise();
    if(res.id) {
      return res;
    }
    else {
      return {
        error: true
      }
    }
  }

  async getPost(id: string): Promise<ProcessedPost[]> {
    let res: ProcessedPost[] = [];
    let petitionData: FormData = new FormData();
    petitionData.append('id', id);
    let petition: RawPost | undefined = await this.http.post<RawPost>(environment.baseUrl + '/singlePost', petitionData).toPromise();
    if(petition) {
      res = this.postService.processPost(petition);
    }

    return res;
  }

}
