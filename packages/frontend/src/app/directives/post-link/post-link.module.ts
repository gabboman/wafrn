import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { PostLinkDirective } from './post-link.directive'

@NgModule({
  declarations: [PostLinkDirective],
  imports: [CommonModule],
  exports: [PostLinkDirective]
})
export class PostLinkModule { }
