import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from './post.component';
import { InjectHtmlModule } from '../../directives/inject-html/inject-html.module';
import { WafrnMediaModule } from '../wafrn-media/wafrn-media.module';
import { PollModule } from '../poll/poll.module';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [
    PostComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    WafrnMediaModule,
    InjectHtmlModule,
    PollModule,
    MatCardModule,
    MatButtonModule
  ],
  exports: [
    PostComponent
  ]
})
export class PostModule { }
