import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { PollModule } from '../poll/poll.module';
import { WafrnMediaModule } from '../wafrn-media/wafrn-media.module';
import { RouterModule } from '@angular/router';
import { InjectHtmlModule } from 'src/app/directives/inject-html/inject-html.module';
import { MatButtonModule } from '@angular/material/button';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';
import { environment } from 'src/environments/environment';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

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
export class PostFragmentComponent implements OnInit {
  @Input() fragment: ProcessedPost | undefined;
  @Input() showCw: boolean = true;
  @Output() dismissCw: EventEmitter<void> = new EventEmitter<void>();
  emojiCollection: {
    id: string;
    content: string;
    img?: string;
    users: SimplifiedUser[];
  }[] = [];
  ngOnInit(): void {
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
