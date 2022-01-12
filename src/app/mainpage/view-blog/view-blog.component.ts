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

  loading = true;
  viewedPosts = 0;
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

    await this.loadPosts(0);
    this.blogDetails = await this.dashboardService.getBlogDetails(this.blogUrl);
    this.loading = false;
  }

  async countViewedPost() {
    this.viewedPosts++;
    if (this.posts.length - 3 < this.viewedPosts) {
      await this.loadPosts(this.posts.length >=20 ?Math.floor(this.posts.length / 20) : 1);
    }
  }

  async loadPosts(page: number) {
    let tmpPosts = await this.dashboardService.getBlogPage(page, this.blogUrl);
    tmpPosts.forEach(post => {
      this.posts.push(post);
    });
  }

}
