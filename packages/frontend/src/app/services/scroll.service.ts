import { Location } from '@angular/common';
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ProcessedPost } from "../interfaces/processed-post";

export enum ScrollContext {
  Inactive,
  Dashboard,
  Blog,
}

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  post!: ProcessedPost;

  constructor(private readonly location: Location, private readonly router: Router) {
  }

  public navigateTo(url: string, post: ProcessedPost) {
    this.post = post;
    this.router.navigateByUrl(url);
  }

  public getLastPost(): ProcessedPost {
    return this.post;
  }

}
