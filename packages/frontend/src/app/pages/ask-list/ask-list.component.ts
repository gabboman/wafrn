import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { SingleAskComponent } from 'src/app/components/single-ask/single-ask.component';
import { Ask } from 'src/app/interfaces/ask';
import { DashboardService } from 'src/app/services/dashboard.service';

@Component({
  selector: 'app-ask-list',
  standalone: true,
  imports: [
    CommonModule,
    SingleAskComponent,
    MatCardModule
  ],
  templateUrl: './ask-list.component.html',
  styleUrl: './ask-list.component.scss'
})
export class AskListComponent {

  loading = true;
  asks: Ask[] = [];

  constructor(
    private dashboard: DashboardService
  ) {
    this.dashboard.getMyAsks().then(
      asks => {
        this.asks = asks;
        this.loading = false;
      }
    )
  }

}
