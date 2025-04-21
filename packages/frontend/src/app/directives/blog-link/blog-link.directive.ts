import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';
import { ScrollService } from 'src/app/services/scroll.service';

@Directive({
  selector: '[blogLink]',
  standalone: false
})
export class BlogLinkDirective implements OnInit {
  @Input({ required: true }) blogLink?: SimplifiedUser | null;

  constructor(private readonly host: ElementRef, private readonly renderer: Renderer2, private readonly scrollService: ScrollService) { }

  async ngOnInit() {
    if (!this.blogLink) return;
    this.renderer.setAttribute(this.host.nativeElement, 'href', '/blog/' + this.blogLink.url)
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.blogLink) return;
    if (event.button === 0) {
      event.preventDefault();
      this.scrollService.navigateToBlog('/blog/' + this.blogLink.url, this.blogLink)
    }
  }
}
