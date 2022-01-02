import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  posts: ProcessedPost[][] = [];
  viewedPosts = 0;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadPosts(0);
  }

  async countViewedPost() {
    this.viewedPosts ++;
    if(this.posts.length -3 < this.viewedPosts) {
      console.log('asking page', Math.floor(this.posts.length / 20))
      await this.loadPosts(Math.floor(this.posts.length / 20) + 1);
      console.log('load things')
    }
  }

  async loadPosts(page: number) {

    let tmpPosts = await this.dashboardService.getDashboardPage(page);
    tmpPosts.forEach(post => {
      this.posts.push(post);
    })
  }

}
