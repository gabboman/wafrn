import { Directive, ElementRef, Input } from '@angular/core'
import { WafrnMedia } from 'src/app/interfaces/wafrn-media'

@Directive({
  selector: '[injectHTML]',
  standalone: false
})
export class InjectHTMLDirective {
  @Input() set injectHTML(content: string | WafrnMedia) {
    if (typeof content == 'string') {
      this.host.nativeElement.innerHTML = content
    }
  }

  constructor(private host: ElementRef) {}
}
