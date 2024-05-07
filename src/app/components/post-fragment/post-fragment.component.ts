import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
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
import { EmojiReactComponent } from '../emoji-react/emoji-react.component';
import { MessageService } from 'src/app/services/message.service';
import { Emoji } from 'src/app/interfaces/emoji';

type EmojiReaction = {
  id: string;
  content: string;
  img?: string;
  external: boolean;
  users: SimplifiedUser[];
};

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
    EmojiReactComponent,
  ],
  templateUrl: './post-fragment.component.html',
  styleUrl: './post-fragment.component.scss',
})
export class PostFragmentComponent implements OnInit, OnDestroy {
  @Input() fragment: ProcessedPost | undefined;
  @Input() showCw: boolean = true;
  @Output() dismissCw: EventEmitter<void> = new EventEmitter<void>();
  emojiCollection: EmojiReaction[] = [];
  likeSubscription;
  emojiSubscription;
  userId;

  reactionLoading = false;

  constructor(
    private postService: PostsService,
    private loginService: LoginService,
    private jwtService: JwtService,
    private messages: MessageService
  ) {
    this.userId = loginService.getLoggedUserUUID();
    this.likeSubscription = postService.postLiked.subscribe((likeEvent) => {
      if (likeEvent.id === this.fragment?.id) {
        this.renderLikeDislike(likeEvent);
      }
    });
    this.emojiSubscription = postService.emojiReacted.subscribe(
      (emojiEvent) => {
        if (emojiEvent.postId === this.fragment?.id) {
          this.renderEmojiReact(emojiEvent);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.likeSubscription.unsubscribe();
  }

  ngOnInit(): void {
    // using a "map" here for O(1) get operations
    const emojiReactions = {} as Record<string, EmojiReaction>;
    if (!this.fragment?.emojiReactions) {
      this.emojiCollection = [];
      return;
    }

    this.fragment.emojiReactions.forEach((reaction) => {
      const hasReaction = !!emojiReactions[reaction.emojiId];
      if (!hasReaction) {
        let image = '';
        if (reaction.emoji?.url) {
          image = reaction.emoji.external
            ? reaction.emoji.url
            : `${environment.baseMediaUrl}${reaction.emoji.url}`;
        }
        // create the basic structure to augment later
        emojiReactions[reaction.emojiId] = {
          id: reaction.emojiId,
          content: reaction.content,
          external: reaction.emoji?.external == true,
          img: image ? `${environment.externalCacheurl}${image}` : undefined,
          users: [], // this will be filled below
        };
      }

      // at this point the current reaction is always defined on the map
      // so we can always access it to increment the users array
      if (reaction.user?.avatar) {
        emojiReactions[reaction.emojiId].users.push(reaction.user);
      }
    });

    this.emojiCollection = Object.values(emojiReactions).sort(
      (a, b) => b.users.length - a.users.length
    );
  }

  getTooltipUsers(users: SimplifiedUser[]): string {
    return users.map((usr) => usr.url).join(', ');
  }

  renderLikeDislike({ like }: { id: string; like: boolean }) {
    let likesCollection = this.emojiCollection.find(
      (elem) => elem.id === 'Like'
    );
    if (like) {
      // CODE TO ADD LIKE
      if (!likesCollection) {
        likesCollection = {
          id: 'Like',
          content: '❤️',
          external: false,
          img: undefined,
          users: [],
        };
        this.emojiCollection.push(likesCollection);
      }
      likesCollection.users.push({
        url: this.jwtService.getTokenData()['url'],
        name: this.jwtService.getTokenData()['url'],
        id: this.loginService.getLoggedUserUUID(),
        avatar: '',
      });
    } else {
      // CODE TO REMOVE LIKE
      console.log(this.emojiCollection, likesCollection);
      if (likesCollection) {
        if (likesCollection.users.length === 1) {
          this.emojiCollection = this.emojiCollection.filter(
            (col) => col.id !== 'Like'
          );
        } else {
          likesCollection.users = likesCollection.users.filter(
            (usr) => usr.id !== this.loginService.getLoggedUserUUID()
          );
        }
      }
    }
  }

  renderEmojiReact({
    emoji,
    type,
  }: {
    postId: string;
    emoji: Emoji;
    type: 'react' | 'undo_react';
  }) {
    const collection = this.emojiCollection.find((e) => e.id === emoji.id);
    if (type === 'react') {
      if (!collection) {
        this.emojiCollection.push({
          id: emoji.id,
          content: emoji.name,
          img: emoji.url,
          external: emoji.external,
          users: [
            {
              url: this.jwtService.getTokenData()['url'],
              name: this.jwtService.getTokenData()['url'],
              id: this.loginService.getLoggedUserUUID(),
              avatar: '',
            },
          ],
        });
      } else {
        collection.users.push({
          url: this.jwtService.getTokenData()['url'],
          name: this.jwtService.getTokenData()['url'],
          id: this.loginService.getLoggedUserUUID(),
          avatar: '',
        });
      }
    } else {
      if (collection) {
        if (collection.users.length === 1) {
          this.emojiCollection = this.emojiCollection.filter(
            (col) => col.id !== emoji.id
          );
        } else {
          collection.users = collection.users.filter(
            (usr) => usr.id !== this.loginService.getLoggedUserUUID()
          );
        }
      }
    }
  }

  isLike(emojiReaction: EmojiReaction) {
    return ['♥️', '❤'].includes(emojiReaction.content);
  }

  async toggleEmojiReact(emojiReaction: EmojiReaction) {
    const postId = this.fragment?.id;
    if (!postId) {
      return;
    }

    this.reactionLoading = true;
    const reactionIsToggled = emojiReaction.users.some(
      (usr) => usr.id === this.userId
    );
    console.log({ emojiReaction, userId: this.userId });

    if (this.isLike(emojiReaction)) {
      if (reactionIsToggled) {
        await this.postService.unlikePost(postId);
      } else {
        await this.postService.likePost(postId);
      }
    } else {
      let response = false;
      if (reactionIsToggled) {
        response = await this.postService.undoEmojiReactPost(postId, {
          id: emojiReaction.id,
          name: emojiReaction.content,
          url: emojiReaction.img!,
          external: false,
        });
        if (response) {
          this.messages.add({
            severity: 'success',
            summary: `Reaction removed succesfully`,
          });
        }
      } else {
        response = await this.postService.emojiReactPost(postId, {
          id: emojiReaction.id,
          name: emojiReaction.content,
          url: emojiReaction.img!,
          external: false,
        });
        if (response) {
          this.messages.add({
            severity: 'success',
            summary: `Reacted with ${emojiReaction.id} succesfully`,
          });
        }
      }

      if (!response) {
        this.messages.add({
          severity: 'error',
          summary: `Something went wrong!`,
        });
      }
    }

    this.reactionLoading = false;
  }

  emojiReactionIncludesMe(emoji: EmojiReaction) {
    return emoji.users.some((usr) => usr.id === this.userId);
  }
}
