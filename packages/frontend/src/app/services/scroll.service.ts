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
export class ScrollService {
  private readonly navigation = new Subject<SnappyNavigation>();

  public navigateTo(url: string, post: ProcessedPost) {
    this.navigation.next(
      {
        url: url,
        data: post,
      });
  }

  public navigateToBlog(url: string, user: SimplifiedUser) {
    this.navigation.next(
      {
        url: url,
        data: user,
      });
  }

  public getObservable(): Observable<SnappyNavigation> {
    return this.navigation.asObservable();
  }
}
