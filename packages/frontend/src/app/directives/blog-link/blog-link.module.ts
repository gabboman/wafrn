import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { BlogLinkDirective } from './blog-link.directive'

@NgModule({
  declarations: [BlogLinkDirective],
  imports: [CommonModule],
  exports: [BlogLinkDirective]
})
export class BlogLinkModule { }
