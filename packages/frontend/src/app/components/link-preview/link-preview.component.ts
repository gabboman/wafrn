import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core'
import { EnvironmentService } from 'src/app/services/environment.service'
import { MediaService } from 'src/app/services/media.service'
import { MatCardModule } from '@angular/material/card'
import { CommonModule } from '@angular/common'
@Component({
  selector: 'app-link-preview',
  imports: [CommonModule, MatCardModule],
  templateUrl: './link-preview.component.html',
  styleUrl: './link-preview.component.scss',
})
export class LinkPreviewComponent implements OnChanges {
  private mediaService = inject(MediaService)

  @Input() link: string = ''

  loading = true
  url = ''
  hostname = ''
  title = ''
  description = ''
  img = ''
  forceTenorGif = false
  forceYoutube = false

  ngOnChanges(changes: SimpleChanges): void {
    this.forceTenorGif = false
    this.forceYoutube = false
    if (this.link) {
      if (this.url.startsWith('https://media.tenor.com/')) {
        this.loading = false
        this.forceTenorGif = true
        return
      }
      this.loading = true
      const linkToGet = this.link.startsWith(EnvironmentService.environment.externalCacheurl)
      this.url = linkToGet ? (new URL(this.link).searchParams.get('media') as string) : this.link
      this.hostname = new URL(this.url).hostname
      this.mediaService.getLinkPreview(this.url).then((data) => {
        this.loading = false
        if (data.images && data.images.length) {
          this.img = EnvironmentService.environment.externalCacheurl + encodeURIComponent(data.images[0])
        }
        if (!this.img && data.favicons && data.favicons.length) {
          this.img =
            EnvironmentService.environment.externalCacheurl +
            encodeURIComponent(data.favicons[data.favicons.length - 1])
        }
        let sitenamePrefix = ''
        if (data.siteName) {
          sitenamePrefix = data.siteName + ' - '
        }
        if (data.title) {
          this.title = sitenamePrefix + data.title
        }
        if (data.description) {
          this.description = data.description
        }
      })
    }
  }
}
