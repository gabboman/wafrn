import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostFragmentComponent } from './post-fragment/post-fragment.component';
import { PostComponent } from './post/post.component';
import { WafrnMediaComponent } from './wafrn-media/wafrn-media.component';
import {EditorModule} from 'primeng/editor';


@NgModule({
  declarations: [
    PostFragmentComponent,
    PostComponent,
    WafrnMediaComponent,
  ],
  imports: [
    CommonModule,
    EditorModule
  ],
  exports: [
    PostFragmentComponent,
    PostComponent,
    WafrnMediaComponent
  ]
})
export class SharedWafrnModule { }
