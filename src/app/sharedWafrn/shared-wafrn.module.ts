import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostFragmentComponent } from './post-fragment/post-fragment.component';
import { PostComponent } from './post/post.component';
import { WafrnMediaComponent } from './wafrn-media/wafrn-media.component';
import {DividerModule} from 'primeng/divider';
import {AvatarModule} from 'primeng/avatar';
import { CheckboxModule } from 'primeng/checkbox';
import {AccordionModule} from 'primeng/accordion';
import {CardModule} from 'primeng/card';
import { InjectHTMLDirective } from '../directives/inject-html.directive';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { TagModule } from 'primeng/tag';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import { CaptchaModule } from 'primeng/captcha';
import {SplitButtonModule} from 'primeng/splitbutton';
@NgModule({
  declarations: [
    PostFragmentComponent,
    PostComponent,
    WafrnMediaComponent,
    InjectHTMLDirective
  ],
  imports: [
    CommonModule,
    DividerModule,
    AvatarModule,
    CheckboxModule,
    AccordionModule,
    CardModule,   
    YouTubePlayerModule,
    ButtonModule,
    RouterModule,
    TagModule,
    OverlayPanelModule,
    CaptchaModule,
    SplitButtonModule
  ],
  exports: [
    PostFragmentComponent,
    PostComponent,
    WafrnMediaComponent,
    InjectHTMLDirective

  ]
})
export class SharedWafrnModule { }
