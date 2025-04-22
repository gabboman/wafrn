import { Injectable } from "@angular/core";
import { ProcessedPost } from "../interfaces/processed-post";
import { Observable, Subject } from 'rxjs';
import { SimplifiedUser } from '../interfaces/simplified-user';


export enum ScrollContext {
  Inactive,
  Dashboard,
  Blog,
}

export interface SnappyNavigation {
  url: string,
  data: any,
}


@Injectable({
  providedIn: 'root'
})
export class SnappyService {
  private readonly navigation = new Subject<SnappyNavigation>();
  private data: any = null;

  public navigateTo(url: string, post: ProcessedPost) {
    this.data = post;
    this.navigation.next(
      {
        url: url,
        data: post,
      });
  }

  public navigateToBlog(url: string, user: SimplifiedUser) {
    this.data = user;
    this.navigation.next(
      {
        url: url,
        data: user,
      });
  }

  public getObservable(): Observable<SnappyNavigation> {
    return this.navigation.asObservable();
  }

  public claimData(): any {
    let data = this.data;
    this.data = null;
    return data;
  }
}

