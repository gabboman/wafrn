import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WafrnMedia } from 'src/app/interfaces/wafrn-media';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-media-preview',
  templateUrl: './media-preview.component.html',
  styleUrls: ['./media-preview.component.scss'],
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
})
export class MediaPreviewComponent implements OnInit {
  @Input() media!: WafrnMedia;
  baseMediaUrl = environment.baseMediaUrl;
  cacheUrl = environment.externalCacheurl;
  success = false;
  elemUrl = '';

  ngOnInit(): void {
    this.updateMediaUrl();
    this.success = true;
  }

  imageLoadFailed(error: any) {
    this.success = false;
    setTimeout(() => {
      this.updateMediaUrl();
      this.success = true;
    }, 1000);
  }

  updateMediaUrl() {
    this.elemUrl = `${this.media.url}?date=${new Date().getTime()}`;
  }
}
