import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';
import { SnappyInjectable, SnappyRouter } from 'src/app/components/snappy/snappy-router.component';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';

@Directive({
  selector: '[blogLink]',
  standalone: false
})
export class BlogLinkDirective implements OnInit {
  @Input({ required: true }) blogLink?: SimplifiedUser | null;

  constructor(private readonly host: ElementRef, private readonly renderer: Renderer2, private readonly snappy: SnappyRouter) { }

  async ngOnInit() {
    if (!this.blogLink) return;
    this.renderer.setAttribute(this.host.nativeElement, 'href', '/blog/' + this.blogLink.url)
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.blogLink) return;
    if (event.button === 0) {
      event.preventDefault();
      const wrapper = new SnappyBlogData(this.blogLink);
      this.snappy.navigateTo('/blog/' + this.blogLink.url, wrapper);
    }
  }
}

@SnappyInjectable
export class SnappyBlogData {
  public blog: SimplifiedUser;

  constructor(blog: SimplifiedUser) {
    this.blog = blog;
  }
}
