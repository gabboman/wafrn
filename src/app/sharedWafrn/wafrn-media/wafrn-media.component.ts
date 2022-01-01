import { Component, Input, OnInit } from '@angular/core';
import { WafrnMedia } from 'src/app/interfaces/wafrn-media';
import { MediaService } from 'src/app/services/media.service';

@Component({
  selector: 'app-wafrn-media',
  templateUrl: './wafrn-media.component.html',
  styleUrls: ['./wafrn-media.component.scss']
})
export class WafrnMediaComponent implements OnInit {


  @Input() data!: WafrnMedia;
  nsfw = true;
  nsfwFilter = true;


  
  constructor(
    private mediaService: MediaService
  ) {
    this.nsfwFilter = !mediaService.checkNSFWFilterDisabled()
   }

  ngOnInit(): void {
    this.nsfw = this.data.NSFW;

  }

  showPicture(){
    this.nsfw = false;
  }

}
