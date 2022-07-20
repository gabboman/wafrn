import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';
import { LoginService } from 'src/app/services/login.service';
import { PostsService } from 'src/app/services/posts.service';
import { environment } from 'src/environments/environment';
import { Title, Meta } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map, tap } from "rxjs/operators";
@Component({
  selector: 'app-view-post',
  templateUrl: './view-post.component.html',
  styleUrls: ['./view-post.component.scss']
})
export class ViewPostComponent implements OnInit {


  post: ProcessedPost[] = [];
  loading = true;
  blogUrl: string = '';
  blogDetails: any;
  mediaUrl = environment.baseMediaUrl;



  constructor(
    private activatedRoute: ActivatedRoute,
    private dashboardService: DashboardService,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title,
    private metaTagService: Meta
  ) {
    this.route.data.subscribe((data) => {
      this.post = data['posts'];
      this.loadSeo();
    })
  }
  ngOnInit(): void {
  }

  loadSeo(){
    if(this.post.length > 0){
      const lastPostFragment = this.post[this.post.length -1];
      this.titleService.setTitle('wafrn - Post by ' + lastPostFragment.user.url);
      this.metaTagService.addTags([
        {name: 'description', content: 'Wafrn post by ' + lastPostFragment.user.url },
        {name: 'author', content: lastPostFragment.user.url },
        {name: 'image', content: this.getImage(this.post)}
      ]);
    }
      this.loading = false;
  }
  // gets either the first non video image from the last post, the fist non video image from the initial post OR the wafrn logo
  getImage(processedPost: ProcessedPost[]): string{
    let res: string = 'https://app.wafrn.net/favicon.ico';
    let firstPostMedias = processedPost[0]?.medias;
    if(firstPostMedias){
      for (let i = 0; i < firstPostMedias.length; i++){
        if(!firstPostMedias[i].url.endsWith('mp4')){
          res = firstPostMedias[i].url;
          break;
        }
      }
    }

    let lastPostMedias = processedPost[processedPost.length]?.medias;
    if(lastPostMedias){
      for (let i = 0; i < lastPostMedias.length; i++){
        if(!lastPostMedias[i].url.endsWith('mp4')){
          res = lastPostMedias[i].url;
          break;
        }
      }
    }
    return res;
  }

}
