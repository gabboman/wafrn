import { AfterViewInit, ChangeDetectorRef, Component, computed, input, OnChanges } from '@angular/core'
import { WafrnMedia } from '../../interfaces/wafrn-media'
import { EnvironmentService } from '../../services/environment.service'
import { MediaService } from '../../services/media.service'
import { MessageService } from '../../services/message.service'
import { faEyeSlash } from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'app-wafrn-media',
  templateUrl: './wafrn-media.component.html',
  styleUrls: ['./wafrn-media.component.scss'],
  standalone: false
})
export class WafrnMediaComponent implements OnChanges, AfterViewInit {
  data = input.required<WafrnMedia>()

  readonly extensionsToHideImgTag = ['mp4', 'aac', 'mp3', 'ogg', 'webm', 'weba', 'svg', 'ogg', 'oga']
  readonly tmpUrl = computed<string>(() =>
    this.data().external
      ? EnvironmentService.environment.externalCacheurl + encodeURIComponent(this.data().url)
      : EnvironmentService.environment.externalCacheurl +
        encodeURIComponent(EnvironmentService.environment.baseMediaUrl + this.data().url)
  )
  readonly displayUrl = computed<string>(() => this.tmpUrl())
  readonly extension = computed<string>(() => this.getExtension())
  readonly mimeType = computed<string>(() => this.getMimeType())
  readonly width = computed<number | ''>(() => this.data().width ?? '')
  readonly height = computed<number | ''>(() => this.data().height ?? '')
  disableNSFWFilter = true

  nsfw = true
  viewLongImage = false
  descriptionVisible = false

  // Icons
  readonly hideIcon = faEyeSlash

  constructor(
    private mediaService: MediaService,
    private messagesService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.disableNSFWFilter = mediaService.checkNSFWFilterDisabled()
  }

  ngOnChanges(): void {
    this.nsfw = this.data().NSFW && !this.disableNSFWFilter
    this.cdr.markForCheck()
  }

  ngAfterViewInit(): void {}

  showPicture() {
    this.nsfw = false
    this.viewLongImage = true
  }

  private getExtension() {
    const mediaUrl = this.data().url.split('.')
    return mediaUrl[mediaUrl.length - 1].toLowerCase()
  }

  private getMimeType() {
    if (this.data().mediaType !== undefined) {
      return this.data().mediaType as string
    }
    switch (this.extension()) {
      case 'mp4': {
        return 'video/mp4'
      }
      case 'webm': {
        return 'video/webm'
      }
      case 'mp3': {
        return 'audio/mpeg'
      }
      case 'wav': {
        return 'audio/wav'
      }
      case 'ogg':
      case 'oga': {
        return 'audio/ogg'
      }
      case 'opus': {
        return 'audio/opus'
      }
      case 'aac': {
        return 'audio/aac'
      }
      case 'm4a': {
        return 'audio/mp4'
      }
      case 'pdf': {
        return 'pdf'
      }
      default: {
        return 'UNKNOWN'
      }
    }
  }
}
