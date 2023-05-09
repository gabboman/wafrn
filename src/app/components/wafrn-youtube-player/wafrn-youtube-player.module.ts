import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WafrnYoutubePlayerComponent } from './wafrn-youtube-player.component';



@NgModule({
  declarations: [
    WafrnYoutubePlayerComponent
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    WafrnYoutubePlayerComponent
  ]
})
export class WafrnYoutubePlayerModule { }
