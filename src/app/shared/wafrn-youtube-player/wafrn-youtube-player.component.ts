import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-wafrn-youtube-player',
  templateUrl: './wafrn-youtube-player.component.html',
  styleUrls: ['./wafrn-youtube-player.component.scss']
})
export class WafrnYoutubePlayerComponent implements OnInit {


  @Input() video!: string;
  videoWidth: number = 0;
  videoHeight: number = 0;

  
  constructor() { }

  ngOnInit(): void {

    this.onResize();

    window.addEventListener('resize', this.onResize);
  }

  onResize = (): void => {

    // Automatically expand the video to fit the page up to 1200px x 720px

    //first post width:

    let firstPostWidth = document.getElementById('firstPost')?.clientWidth

    this.videoWidth = firstPostWidth ? firstPostWidth * 0.93 : 480;

    this.videoHeight = this.videoWidth * 0.6;

    // this.cdr.detectChanges();

  }



  ngOnDestroy(): void {

    window.removeEventListener('resize', this.onResize);

  }

}
