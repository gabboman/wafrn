import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { PollModule } from '../poll/poll.module';
import { WafrnMediaModule } from '../wafrn-media/wafrn-media.module';
import { RouterModule } from '@angular/router';
import { InjectHtmlModule } from 'src/app/directives/inject-html/inject-html.module';
import { MatButtonModule } from '@angular/material/button';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';

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
  ],
  templateUrl: './post-fragment.component.html',
  styleUrl: './post-fragment.component.scss',
})
export class PostFragmentComponent implements OnInit {
  @Input() fragment: ProcessedPost | undefined;
  @Input() showCw: boolean = true;
  @Output() dismissCw: EventEmitter<void> = new EventEmitter<void>();
  emojiCollection: {
    content: string;
    img: string;
    users: SimplifiedUser[];
  }[] = [];
  ngOnInit(): void {
    if(this.fragment?.emojiReactions) {

    }
  }
}
