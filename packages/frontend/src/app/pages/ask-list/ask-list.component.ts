import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SingleAskComponent } from 'src/app/components/single-ask/single-ask.component';
import { Ask } from 'src/app/interfaces/ask';
import { DashboardService } from 'src/app/services/dashboard.service';
import { EditorService } from 'src/app/services/editor.service';

@Component({
  selector: 'app-ask-list',
  standalone: true,
  imports: [
    CommonModule,
    SingleAskComponent,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './ask-list.component.html',
  styleUrl: './ask-list.component.scss'
})
export class AskListComponent {

  loading = true;
  asks: Ask[] = [];

  constructor(
    private dashboard: DashboardService,
    private editor: EditorService
  ) {
    this.dashboard.getMyAsks().then(
      asks => {
        this.asks = asks;
        this.loading = false;
      }
    )
  }

  ignoreAsk(ask: Ask) {
    console.log('ignore')
  }

  replyAsk(ask: Ask) {
    this.editor.replyAsk(ask)
  }


}
