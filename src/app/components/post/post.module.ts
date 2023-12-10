import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from './post.component';
import { InjectHtmlModule } from '../../directives/inject-html/inject-html.module';
import { WafrnMediaModule } from '../wafrn-media/wafrn-media.module';
import { PollModule } from '../poll/poll.module';


@NgModule({
  declarations: [
    PostComponent
  ],
  imports: [
    CommonModule,
    WafrnMediaModule,
    InjectHtmlModule,
    PollModule,
  ],
  exports: [
    PostComponent
  ]
})
export class PostModule { }
