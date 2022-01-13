import { Component, OnInit } from '@angular/core';
import { ReportService } from 'src/app/services/report.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-report-post',
  templateUrl: './report-post.component.html',
  styleUrls: ['./report-post.component.scss']
})
export class ReportPostComponent implements OnInit {

  postToReport: string = '';
  loading = false;
  reportForm: FormGroup = new FormGroup({
    description: new FormControl('', [Validators.required]),
    severity: new FormControl('', [Validators.required]),

  });

  constructor(
    private reportService: ReportService,
    private messages: MessageService
  ) { }

  ngOnInit(): void {

    this.reportService.launchReportScreen.subscribe( (reportedPost) => {
      if(reportedPost) {
        this.postToReport = reportedPost;
      }
    })
  }

  async submit() {

    this.reportService.reportPost(this.postToReport, this.reportForm.value['severity'], this.reportForm.value['description'] )

  }

}
