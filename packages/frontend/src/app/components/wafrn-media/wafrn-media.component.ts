import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  ViewChild
} from '@angular/core'
import { WafrnMedia } from '../../interfaces/wafrn-media'
import { EnvironmentService } from '../../services/environment.service'
import { MediaService } from '../../services/media.service'
import { MessageService } from '../../services/message.service'

@Component({
  selector: 'app-wafrn-media',
  templateUrl: './wafrn-media.component.html',
  styleUrls: ['./wafrn-media.component.scss'],
  standalone: false
})
export class WafrnMediaComponent implements OnChanges, AfterViewInit {
  nsfw = true
  @Input() data!: WafrnMedia
  @Input() mediaOrString!: WafrnMedia | string
  tmpUrl = ''
  displayUrl: string = ''
  disableNSFWFilter = true
  @ViewChild('media', { read: ElementRef }) wafrnMedia!: ElementRef
  extension = ''
  viewLongImage = false
  extensionsToHideImgTag = ['mp4', 'aac', 'mp3', 'ogg', 'webm', 'weba', 'svg', 'ogg', 'oga']
  mimeType = ''
  height = 1
  width = 1
  constructor(
    private mediaService: MediaService,
    private messagesService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.disableNSFWFilter = mediaService.checkNSFWFilterDisabled()
  }

  ngOnChanges(): void {
    if (this.mediaOrString && typeof this.mediaOrString != 'string') {
      this.data = this.mediaOrString as WafrnMedia
    }
    if (this.data) {
      this.extension = this.getExtension()
      this.tmpUrl = this.data.external
        ? EnvironmentService.environment.externalCacheurl + encodeURIComponent(this.data.url)
        : EnvironmentService.environment.externalCacheurl +
          encodeURIComponent(EnvironmentService.environment.baseMediaUrl + this.data.url)
      this.nsfw = this.data.NSFW && !this.disableNSFWFilter
      this.displayUrl = this.tmpUrl //this.nsfw ? '/assets/img/nsfw_image.webp' : this.tmpUrl;
      if (this.data.mediaType) {
        this.mimeType = this.data.mediaType
      } else {
        switch (this.extension) {
          case 'mp4': {
            this.mimeType = 'video/mp4'
            break
          }
          case 'webm': {
            this.mimeType = 'video/webm'
            break
          }
          case 'mp3': {
            this.mimeType = 'audio/mpeg'
            break
          }
          case 'wav': {
            this.mimeType = 'audio/wav'
            break
          }
          case 'ogg':
          case 'oga': {
            this.mimeType = 'audio/ogg'
            break
          }
          case 'opus': {
            this.mimeType = 'audio/opus'
            break
          }
          case 'aac': {
            this.mimeType = 'audio/aac'
            break
          }
          case 'm4a': {
            this.mimeType = 'audio/mp4'
            break
          }
          case 'pdf': {
            this.mimeType = 'pdf'
            break
          }
          default: {
            this.mimeType = 'UNKNOWN'
          }
        }
      }
      this.cdr.markForCheck()
    }
  }

  ngAfterViewInit(): void {
    // console.log(this.wafrnMedia.nativeElement)
  }

  showPicture() {
    this.nsfw = false
    this.displayUrl = this.tmpUrl
    this.viewLongImage = true
  }

  private getExtension() {
    const mediaUrl = this.data.url.split('.')
    return mediaUrl[mediaUrl.length - 1].toLowerCase()
  }
}
