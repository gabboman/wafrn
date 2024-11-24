import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ReportService } from 'src/app/services/report.service';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { BlocksService } from 'src/app/services/blocks.service';
import { MessageService } from 'src/app/services/message.service';
import { CommonModule } from '@angular/common';
import {
  MatDialogContent,
  MatDialogTitle,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
@Component({
    selector: 'app-report-post',
    templateUrl: './report-post.component.html',
    styleUrls: ['./report-post.component.scss'],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogContent,
        MatDialogTitle,
        MatDialogActions,
        MatDialogClose,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
    ]
})
export class ReportPostComponent implements OnDestroy {
  loading = false;
  visible = false;
  reportForm: UntypedFormGroup;
  postToReport: ProcessedPost[];
  launchreportScreenSubscription;

  reportOptions: Array<{ label: string; value: number }> = [
    {
      label: 'This post is spam',
      value: 1,
    },
    {
      label: 'This post contains NSFW media and is not labelled as such',
      value: 2,
    },
    {
      label: 'This post is inciting hate against a person or collective',
      value: 5,
    },
    {
      label: 'This post contains illegal content',
      value: 10,
    },
  ];

  constructor(
    private reportService: ReportService,
    private messages: MessageService,
    private readonly formBuilder: UntypedFormBuilder,
    private blockService: BlocksService,
    private dialogRef: MatDialogRef<ReportPostComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { post: ProcessedPost }
  ) {
    this.postToReport = [data.post];
    // I could call clearForm, but that will calm typescript typechecker
    this.reportForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      severity: ['', [Validators.required]],
      block: [''],
    });
    this.launchreportScreenSubscription = this.reportService.launchReportScreen.subscribe((reportedPost) => {
      if (reportedPost) {
        this.postToReport = reportedPost;
      }
    });
  }
  ngOnDestroy(): void {
    this.launchreportScreenSubscription.unsubscribe();
  }

  async submit() {
    if (this.postToReport) {
      const reportDone = this.reportService.reportPost(
        this.postToReport,
        this.reportForm
      );
      if (this.reportForm.value['block'].length === 1) {
        const userBlocked = this.blockService.blockUser(
          this.postToReport[this.postToReport.length - 1].userId
        );
        Promise.all([reportDone, userBlocked]);
      }
      if (await reportDone) {
        this.messages.add({
          severity: 'success',
          summary:
            'The post has been reported and we will take action against it',
        });

        this.dialogRef.close();
        this.clearForm();
      }
    }
  }

  cancelReport() {
    this.dialogRef.close();
    this.clearForm();
  }

  clearForm() {
    this.reportForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      severity: ['', [Validators.required]],
      block: [''],
    });
  }
}
