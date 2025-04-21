import { Location } from '@angular/common';
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ProcessedPost } from "../interfaces/processed-post";
import { Observable, Subject } from 'rxjs';

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
  post!: ProcessedPost;

  private navigation = new Subject<SnappyNavigation>();

  constructor(private readonly location: Location, private readonly router: Router) {
  }

  public navigateTo(url: string, post: ProcessedPost) {
    this.post = post;
    this.navigation.next(
      {
        url: url,
        data: post,
      });
  }

  public getObservable(): Observable<SnappyNavigation> {
    return this.navigation.asObservable();
  }

  public getLastPost(): ProcessedPost {
    return this.post;
  }

}
