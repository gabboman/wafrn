import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from './post.component';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TagModule } from 'primeng/tag';
import {DividerModule} from 'primeng/divider';
import {SplitButtonModule} from 'primeng/splitbutton';
import { InjectHtmlModule } from '../directives/inject-html/inject-html.module';
import { WafrnMediaModule } from '../wafrn-media/wafrn-media.module';
import { WafrnYoutubePlayerModule } from '../wafrn-youtube-player/wafrn-youtube-player.module';



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
    OverlayPanelModule,
    SplitButtonModule,
    WafrnMediaModule,
    WafrnYoutubePlayerModule,
    InjectHtmlModule
  ],
  exports: [
    PostComponent
  ]
})
export class PostModule { }
