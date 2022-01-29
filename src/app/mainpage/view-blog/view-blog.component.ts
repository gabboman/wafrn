import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-view-blog',
  templateUrl: './view-blog.component.html',
  styleUrls: ['./view-blog.component.scss']
})
export class ViewBlogComponent implements OnInit {
  //TODO try to put the logic of search, viewblog, dashboard, explore in the same thingy
  loading = true;
  viewedPosts = 0;
  currentPage = 0;
  mediaUrl = environment.baseMediaUrl;
  posts: ProcessedPost[][] = [];
  blogUrl: string = '';
  blogDetails: any;


  constructor(
    private activatedRoute: ActivatedRoute,
    private dashboardService: DashboardService
  ) { }

  async ngOnInit(): Promise<void> {
    let blogUrl = this.activatedRoute.snapshot.paramMap.get('url');
    if(blogUrl) {
      this.blogUrl = blogUrl;
    }

    await this.loadPosts(this.currentPage);
    this.blogDetails = await this.dashboardService.getBlogDetails(this.blogUrl);
    this.loading = false;
  }

  async countViewedPost() {
    this.viewedPosts++;
    if (this.posts.length - 3 < this.viewedPosts) {
      this.currentPage++;
      await this.loadPosts(this.currentPage);
    }
  }

  async loadPosts(page: number) {
    let tmpPosts = await this.dashboardService.getBlogPage(page, this.blogUrl);
    tmpPosts.forEach(post => {
      this.posts.push(post);
    });
  }

}
