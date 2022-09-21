import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { DashboardService } from 'src/app/services/dashboard.service';
import { LoginService } from 'src/app/services/login.service';
import { environment } from 'src/environments/environment';
import { Title, Meta } from '@angular/platform-browser';
import { UtilsService } from 'src/app/services/utils.service';
import { PostsService } from 'src/app/services/posts.service';
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
    private postService: PostsService,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private utilsService: UtilsService
  ) {
    this.route.data.subscribe((data) => {
      this.post = data['posts'];
      const lastPostFragment = this.post[this.post.length -1];
      this.utilsService.setSEOTags('Wafrn - Post by ' + lastPostFragment.user.url, 'Wafrn post by ' + lastPostFragment.user.url + ': ' + this.postService.getPostContentSanitized(lastPostFragment.content), lastPostFragment.user.url, this.getImage(this.post));
      this.loading = false;
    })
  }
  ngOnInit(): void {
  }

  // gets either the first non video image from the last post, the fist non video image from the initial post OR the wafrn logo
  getImage(processedPost: ProcessedPost[]): string{
    const posterAvatar = environment.baseMediaUrl + processedPost[processedPost.length -1 ]?.user.avatar;
    let res: string = posterAvatar? posterAvatar : 'https://app.wafrn.net/favicon.ico';
    let firstPostMedias = processedPost[0]?.medias;
    if(firstPostMedias){
      for (let i = 0; i < firstPostMedias.length; i++){
        const mp4 = firstPostMedias[i].url.toLowerCase().endsWith('mp4');
        const nsfw = firstPostMedias[i].NSFW
        if(!mp4 && !nsfw){
          res = firstPostMedias[i].url;
          break;
        }
      }
    }

    let lastPostMedias = processedPost[processedPost.length -1 ]?.medias;
    if(lastPostMedias){
      for (let i = 0; i < lastPostMedias.length; i++){
        const mp4 = lastPostMedias[i].url.toLowerCase().endsWith('mp4');
        const nsfw = lastPostMedias[i].NSFW
        if(!mp4 && !nsfw){
          res = lastPostMedias[i].url;
          break;
        }
      }
    }
    console.log(res)
    return res;
  }

}
