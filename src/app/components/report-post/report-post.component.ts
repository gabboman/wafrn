import { Component, OnInit } from '@angular/core';
import { ReportService } from 'src/app/services/report.service';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ProcessedPost } from 'src/app/interfaces/processed-post';
import { BlocksService } from 'src/app/services/blocks.service';


@Component({
  selector: 'app-report-post',
  templateUrl: './report-post.component.html',
  styleUrls: ['./report-post.component.scss']
})
export class ReportPostComponent implements OnInit {

  postToReport!: ProcessedPost[] | undefined;
  loading = false;
  visible = false;
  reportForm: UntypedFormGroup;


  reportOptions: Array<{label: string, value: number}> = [
    {
      label: 'This post is spam',
      value: 0
    },
    {
      label: 'This post contains NSFW media and is not labelled as such',
      value: 1
    },
    {
      label: 'This post is inciting hate against a person or collective',
      value: 5
    },
    {
      label: 'This post contains illegal content',
      value: 10
    }
  ];

  constructor(
    private reportService: ReportService,
    private messages: MessageService,
    private readonly formBuilder: UntypedFormBuilder,
    private blockService: BlocksService
  ) {
    // I could call clearForm, but that will calm typescript typechecker
    this.reportForm =  this.formBuilder.group({
      description: ['', [Validators.required]],
      severity: ['', [Validators.required]],
      block: ['']
    });

  }

  ngOnInit(): void {
    this.reportService.launchReportScreen.subscribe( (reportedPost) => {
      if(reportedPost) {
        this.postToReport = reportedPost;
        this.visible = true;
      }
    })
  }

  async submit() {
    if(this.postToReport) {
      const reportDone = this.reportService.reportPost(this.postToReport, this.reportForm);
      if(this.reportForm.value['block'].length === 1){
        const userBlocked = this.blockService.blockUser(this.postToReport[this.postToReport.length -1].userId);
        Promise.all([reportDone, userBlocked]);
      }
      if(await reportDone) {
        this.messages.add({ severity: 'success', summary: 'The post has been reported and we will take action against it' });

        this.postToReport = undefined;
        this.visible = false;
        this.clearForm();
      }
    }
  }

  cancelReport(){
    this.postToReport = undefined;
    this.visible = false;
    this.clearForm();
  }

  clearForm() {
    this.reportForm =  this.formBuilder.group({
      description: ['', [Validators.required]],
      severity: ['', [Validators.required]],
      block: ['']
    });
  }

}
