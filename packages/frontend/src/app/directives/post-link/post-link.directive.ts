import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { ScrollService } from 'src/app/services/scroll.service';

@Directive({
  selector: '[postLink]',
  standalone: false
})
export class PostLinkDirective implements OnInit {
  @Input({ required: true }) postLink!: ProcessedPost;
  @Input() postLinkId?: string;

  constructor(private readonly host: ElementRef, private readonly renderer: Renderer2, private readonly scrollService: ScrollService) { }

  async ngOnInit() {
    if (!this.postLinkId) {
      this.postLinkId = this.postLink.id;
    }
    this.renderer.setAttribute(this.host.nativeElement, 'href', '/fediverse/post/' + this.postLinkId)
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (event.button === 0) {
      event.preventDefault();
      this.scrollService.navigateTo('/fediverse/post/' + this.postLinkId!, this.postLink)
    }
  }
}
