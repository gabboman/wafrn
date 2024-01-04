import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from './post.component';
import { InjectHtmlModule } from '../../directives/inject-html/inject-html.module';
import { WafrnMediaModule } from '../wafrn-media/wafrn-media.module';
import { PollModule } from '../poll/poll.module';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialogModule } from '@angular/material/dialog';
import { ReportService } from 'src/app/services/report.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [PostComponent],
  imports: [
    CommonModule,
    RouterModule,
    WafrnMediaModule,
    InjectHtmlModule,
    PollModule,
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    FontAwesomeModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  exports: [PostComponent],
  providers: [ReportService],
})
export class PostModule {}
