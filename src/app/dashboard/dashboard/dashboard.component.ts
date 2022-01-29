import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  posts: ProcessedPost[][] = [];
  viewedPosts = 0;
  currentPage= 0;
  explore = false;



  constructor(
    private dashboardService: DashboardService,
    private jwtService: JwtService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    if(this.router.url.indexOf('explore') != -1) {
      this.explore = true;
    }
    if(!this.jwtService.tokenValid()) {
      localStorage.clear();
      this.router.navigate(['/']);
    }
    await this.loadPosts(this.currentPage);

  }

  async countViewedPost() {
    this.viewedPosts++;
    if (this.posts.length - 1 < this.viewedPosts) {
      this.currentPage ++;
      await this.loadPosts(this.currentPage);
    }
  }

  async loadPosts(page: number) {

    let tmpPosts = await this.dashboardService.getDashboardPage(page, this.explore);
    tmpPosts.forEach(post => {
      this.posts.push(post);
    })
  }



}
