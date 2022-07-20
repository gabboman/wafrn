import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { from, Observable, of } from 'rxjs';
import { ProcessedPost } from '../interfaces/processed-post';
import { DashboardService } from '../services/dashboard.service';
import { PostsService } from '../services/posts.service';
//import {  } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class PostResolver implements Resolve<ProcessedPost[]> {
  
  constructor(
    private dashboardService: DashboardService
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ProcessedPost[]> {
    const id = route.paramMap.get('id');
    const res =  this.dashboardService.getPost(id? id : '');
    return from(res);
  }
}
