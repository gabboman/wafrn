import { ChangeDetectorRef, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { WafrnMedia } from 'src/app/interfaces/wafrn-media';
import { MediaService } from 'src/app/services/media.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-wafrn-media',
  templateUrl: './wafrn-media.component.html',
  styleUrls: ['./wafrn-media.component.scss']
})
export class WafrnMediaComponent implements OnChanges {


  nsfw = true;
  adultContent = true;
  @Input() data!: WafrnMedia;
  displayUrl: string = '';
  disableNSFWFilter = true;
  @ViewChild('wafrnMedia') wafrnMedia!: HTMLElement;
  extension = '';
  viewLongImage = false;
  extensionsToHideImgTag = ['mp4', 'aac', 'mp3', 'ogg', 'webm', 'weba', 'svg', 'ogg', 'oga']
  mimeType = '';



  constructor(
    private mediaService: MediaService,
    private messagesService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.disableNSFWFilter = mediaService.checkNSFWFilterDisabled();
   }

  ngOnChanges(): void {
    if(this.data){
      this.extension = this.getExtension();
      this.data.url =  this.data.external ?
        environment.externalCacheurl + encodeURIComponent(this.data.url) :
        environment.baseMediaUrl + this.data.url
      this.nsfw = this.data.adultContent ? true : this.data.NSFW && ! this.disableNSFWFilter;
      this.adultContent = this.data.adultContent;
      this.displayUrl = this.nsfw ? '/assets/img/nsfw_image.webp' : this.data.url;
      switch (this.extension){
        case 'mp4': {
          this.mimeType = 'video/mp4'
          break;
        }
        case 'webm': {
          this.mimeType = 'video/webm'
          break;
        }
        case 'mp3':{
          this.mimeType = 'audio/mpeg'
          break;
        }
        case 'wav': {
          this.mimeType = 'audio/wav';
          break;
        }
        case 'ogg':
        case 'oga': {
          this.mimeType = 'audio/ogg';
          break;
        }
        case 'opus': {
          this.mimeType = 'audio/opus';
          break;
        }
        case 'aac': {
          this.mimeType = 'audio/aac';
          break;
        }
        case 'm4a': {
          this.mimeType = 'audio/mp4';
          break;
        }
        default: {
          this.mimeType= 'UNKNOWN'

        }
      }
    }
    this.cdr.markForCheck()
  }

  showPicture(){
    if(!(this.adultContent && !this.mediaService.checkAge())) {
      this.nsfw = false;
      this.adultContent = false;
      this.displayUrl = this.data ? this.data.url : 'UNDEFINED' ;
      this.viewLongImage = true;
    } else {
      this.messagesService.add({
        severity: 'warn',
        detail: 'This image has been flagged as adult content and you are a minor, or you are not logged in'
      })
    }


  }


  imgLoaded() {
    if(!this.viewLongImage && this.wafrnMedia.offsetHeight/this.wafrnMedia.offsetWidth > 3) {
      this.displayUrl = this.nsfw ? '/assets/img/nsfw_image.webp' : '/assets/img/long_image.jpg'
    }
  }

  private getExtension(){
    const mediaUrl = this.data.url.split('.');
    return mediaUrl[mediaUrl.length -1].toLowerCase();
  }

}
