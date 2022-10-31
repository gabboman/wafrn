import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WafrnYoutubePlayerComponent } from './wafrn-youtube-player.component';
import { YouTubePlayerModule } from '@angular/youtube-player';



@NgModule({
  declarations: [
    WafrnYoutubePlayerComponent
  ],
  imports: [
    CommonModule,
    YouTubePlayerModule,

  ],
  exports: [
    WafrnYoutubePlayerComponent
  ]
})
export class WafrnYoutubePlayerModule { }
