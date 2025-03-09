import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core'
import { EnvironmentService } from 'src/app/services/environment.service'
import { MediaService } from 'src/app/services/media.service'
import { LoaderComponent } from '../loader/loader.component'
import { MatCardModule } from '@angular/material/card'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-link-preview',
  imports: [CommonModule, LoaderComponent, MatCardModule],
  templateUrl: './link-preview.component.html',
  styleUrl: './link-preview.component.scss'
})
export class LinkPreviewComponent implements OnChanges {
  private mediaService = inject(MediaService)

  @Input() link: string = ''

  loading = true
  url = ''
  title = ''
  description = ''
  img = ''

  ngOnChanges(changes: SimpleChanges): void {
    if (this.link) {
      this.loading = true
      const linkToGet = this.link.startsWith(EnvironmentService.environment.externalCacheurl)
      this.url = linkToGet ? (new URL(this.link).searchParams.get('media') as string) : this.link
      this.mediaService.getLinkPreview(this.url).then((data) => {
        console.log(data)
        this.loading = false
        if (data.images && data.images.length) {
          this.img = data.images[0]
        }
        if (data.siteName) {
          this.title = data.siteName
        }
        if (data.title) {
          this.title = this.title + ' - ' + data.title
        }
        if (data.description) {
          this.description = data.description
        }
      })
    }
  }
}
