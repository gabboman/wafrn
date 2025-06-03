import { CommonModule } from '@angular/common'
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { WafrnMedia } from 'src/app/interfaces/wafrn-media'
import { EnvironmentService } from 'src/app/services/environment.service'

@Component({
  selector: 'app-media-preview',
  templateUrl: './media-preview.component.html',
  styleUrls: ['./media-preview.component.scss'],
  imports: [CommonModule, MatProgressSpinnerModule]
})
export class MediaPreviewComponent implements OnInit {
  @Input() media!: WafrnMedia
  baseMediaUrl = EnvironmentService.environment.baseMediaUrl
  cacheUrl = EnvironmentService.environment.externalCacheurl
  success = false
  elemUrl = ''

  ngOnInit(): void {
    this.updateMediaUrl()
    this.success = true
  }

  imageLoadFailed(error: any) {
    this.success = false
    setTimeout(() => {
      this.updateMediaUrl(true)
      this.success = true
    }, 1000)
  }

  updateMediaUrl(forceTimestamp = false) {
    this.elemUrl = `${this.media.url}`
    if (forceTimestamp) {
      this.elemUrl = this.elemUrl + `?date=${new Date().getTime()}`
    }
  }
}
