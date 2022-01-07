import { Component, Input, OnInit } from '@angular/core';
import { WafrnMedia } from 'src/app/interfaces/wafrn-media';
import { MediaService } from 'src/app/services/media.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-wafrn-media',
  templateUrl: './wafrn-media.component.html',
  styleUrls: ['./wafrn-media.component.scss']
})
export class WafrnMediaComponent implements OnInit {


  @Input() id!: string;
  nsfw = true;
  data!: WafrnMedia;
  nsfwFilter = true;
  ready = false;


  
  constructor(
    private mediaService: MediaService
  ) {
    this.nsfwFilter = !mediaService.checkNSFWFilterDisabled();
   }

  ngOnInit(): void {

    this.data = this.mediaService.getMediaById(this.id);
    this.ready = true;

  }

  showPicture(){
    this.nsfw = false;
  }

}
