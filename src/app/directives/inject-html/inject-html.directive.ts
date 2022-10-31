import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[injectHTML]'
})
export class InjectHTMLDirective {

  @Input() set injectHTML(content: string) {
    this.host.nativeElement.innerHTML = content;
  }

  constructor(private host: ElementRef) {
   }

}
