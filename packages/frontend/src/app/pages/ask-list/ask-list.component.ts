import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SingleAskComponent } from 'src/app/components/single-ask/single-ask.component';
import { Ask } from 'src/app/interfaces/ask';
import { BlogService } from 'src/app/services/blog.service';
import { DashboardService } from 'src/app/services/dashboard.service';
import { EditorService } from 'src/app/services/editor.service';
import { LoaderComponent } from 'src/app/components/loader/loader.component';

@Component({
    selector: 'app-ask-list',
    imports: [
        CommonModule,
        SingleAskComponent,
        MatButtonModule,
        MatCardModule,
        LoaderComponent
    ],
    templateUrl: './ask-list.component.html',
    styleUrl: './ask-list.component.scss'
})
export class AskListComponent {

  loading = true;
  asks: Ask[] = [];

  constructor(
    private dashboard: DashboardService,
    private editor: EditorService,
    private blogService: BlogService
  ) {
    this.dashboard.getMyAsks().then(
      asks => {
        this.asks = asks;
        this.loading = false;
      }
    )
  }

  async ignoreAsk(ask: Ask) {
    await this.blogService.ignoreAsk(ask)
    window.location.reload()
  }

  replyAsk(ask: Ask) {
    this.editor.replyAsk(ask)
  }


}
