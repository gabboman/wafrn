import { Component, Input, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-wafrn-youtube-player',
  templateUrl: './wafrn-youtube-player.component.html',
  styleUrls: ['./wafrn-youtube-player.component.scss']
})
export class WafrnYoutubePlayerComponent implements OnInit {


  @Input() video!: string;
  videoThumbnail = ""


  constructor() { }

  ngOnInit(): void {
    const remoteThumbnail = `https://img.youtube.com/vi/${this.video}/default.jpg`
    this.videoThumbnail = environment.externalCacheurl + encodeURIComponent(remoteThumbnail)

  }
}
