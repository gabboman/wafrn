import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from './post.component';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialogModule } from '@angular/material/dialog';
import { ReportService } from 'src/app/services/report.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PostFragmentComponent } from '../post-fragment/post-fragment.component';
import { PostActionsComponent } from '../post-actions/post-actions.component';

@NgModule({
  declarations: [PostComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    FontAwesomeModule,
    MatDialogModule,
    MatTooltipModule,
    PostFragmentComponent,
    PostActionsComponent,
  ],
  exports: [PostComponent],
  providers: [ReportService],
})
export class PostModule {}
