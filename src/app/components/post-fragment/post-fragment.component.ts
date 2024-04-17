import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { PollModule } from '../poll/poll.module';
import { WafrnMediaModule } from '../wafrn-media/wafrn-media.module';
import { RouterModule } from '@angular/router';
import { InjectHtmlModule } from 'src/app/directives/inject-html/inject-html.module';
import { MatButtonModule } from '@angular/material/button';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';
import { environment } from 'src/environments/environment';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PostsService } from 'src/app/services/posts.service';
import { LoginService } from 'src/app/services/login.service';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
  selector: 'app-post-fragment',
  standalone: true,
  imports: [
    CommonModule,
    PollModule,
    WafrnMediaModule,
    RouterModule,
    InjectHtmlModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './post-fragment.component.html',
  styleUrl: './post-fragment.component.scss',
})
export class PostFragmentComponent implements OnInit, OnDestroy{
  @Input() fragment: ProcessedPost | undefined;
  @Input() showCw: boolean = true;
  @Output() dismissCw: EventEmitter<void> = new EventEmitter<void>();
  emojiCollection: {
    id: string;
    content: string;
    img?: string;
    users: SimplifiedUser[];
  }[] = [];
  likeSubscription;

  constructor (
    private postService: PostsService,
    private loginService: LoginService,
    private jwtService: JwtService
  ) {
    this.likeSubscription = postService.postLiked.subscribe(likeEvent => {
      if(likeEvent.id === this.fragment?.id) {
        if(likeEvent.like) {
          // CODE TO ADD LIKE
          let likesCollection = this.emojiCollection.find(elem => elem.id === 'Like');
          const usr = {
            url: this.jwtService.getTokenData()['url'],
            name: this.jwtService.getTokenData()['url'],
            avatar: '',
            id: this.loginService.getLoggedUserUUID()
          };
          if (!likesCollection) {
            likesCollection = {
              id: 'Like',
              content: '❤️',
              img: undefined,
              users: [usr]
            }
            this.emojiCollection.push(likesCollection)
          } else {
            likesCollection.users.push(usr)
          }
          
        } else {
          // CODE TO REMOVE LIKE
          const likesCollection = this.emojiCollection.find(elem => elem.id === 'Like');
          console.log(this.emojiCollection, likesCollection)
          if(likesCollection) {
            if (likesCollection.users.length === 1) {
              this.emojiCollection = this.emojiCollection.filter((col) => col.id !== 'Like')
            } else {
              likesCollection.users = likesCollection.users.filter(usr => usr.id !== this.loginService.getLoggedUserUUID())
            }
          } 
        }
      }
    })
  }
  ngOnDestroy(): void {
    this.likeSubscription.unsubscribe();
  }
  ngOnInit(): void {
    this.emojiCollection = [];
    if (this.fragment?.emojiReactions) {
      // this is n^2 but fuck this we expect the emojis to be small. and no, i am not adding _ to wafrn again
      this.fragment.emojiReactions.forEach((reaction) => {
        if (!this.emojiCollection.find((col) => col.id === reaction.emojiId)) {
          this.emojiCollection.push({
            id: reaction.emojiId,
            content: reaction.content,
            img: reaction.emoji?.url
              ? environment.externalCacheurl +
              encodeURIComponent(reaction.emoji.url)
              : undefined,
            users: this.fragment?.emojiReactions
              .filter(
                (reactToFilter) => reactToFilter.emojiId === reaction.emojiId
              )
              .map((reac) => reac.user)
              .filter((usr) => usr?.avatar) as SimplifiedUser[],
          });
        }
      });
      this.emojiCollection = this.emojiCollection.sort(
        (a, b) => b.users.length - a.users.length
      );
    }
  }

  getTooltipUsers(users: SimplifiedUser[]): string {
    return users.map((usr) => usr.url).join(',');
  }
}
