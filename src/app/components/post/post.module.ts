import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from './post.component';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import {DividerModule} from 'primeng/divider';
import {SplitButtonModule} from 'primeng/splitbutton';
import { InjectHtmlModule } from '../../directives/inject-html/inject-html.module';
import { WafrnMediaModule } from '../wafrn-media/wafrn-media.module';
import { WafrnYoutubePlayerModule } from '../wafrn-youtube-player/wafrn-youtube-player.module';
import { PollModule } from '../poll/poll.module';



@NgModule({
  declarations: [
    PostComponent
  ],
  imports: [
    CommonModule,
    DividerModule,
    CheckboxModule,
    CardModule,
    TagModule,
    SplitButtonModule,
    WafrnMediaModule,
    WafrnYoutubePlayerModule,
    InjectHtmlModule,
    PollModule
  ],
  exports: [
    PostComponent
  ]
})
export class PostModule { }
