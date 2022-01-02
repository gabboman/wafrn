import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ProcessedPost } from '../interfaces/processed-post';
import { RawPost } from '../interfaces/raw-post';
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


  async getDashboardPage(page: number): Promise<ProcessedPost[][]> {
    let result: ProcessedPost[][] = [];
    if(page === 0) {
      //if we are starting the scroll, we store the current date
      this.startScrollDate = new Date();
    }
    let petitionData: FormData = new FormData();
    petitionData.append('page', page.toString());
    petitionData.append('startScroll', this.startScrollDate.toString());
    let dashboardPetition: Array<RawPost> | undefined = await this.http.post<Array<RawPost>>(environment.baseUrl + '/dashboard', petitionData).toPromise();
    if(dashboardPetition) {
      result = dashboardPetition.map(elem => this.postService.processPost(elem));
    } else {
      // TODO show error message
    }


    return result;

  }


}
