import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ReplaySubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProcessedPost } from '../interfaces/processed-post';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'any',
})
export class ReportService {
  public launchReportScreen: ReplaySubject<Array<ProcessedPost>> =
    new ReplaySubject();

  constructor(
    private http: HttpClient, //private messages: MessageService
    private dialogService: MatDialog
  ) { }

  async reportPost(
    post: ProcessedPost[],
    report: UntypedFormGroup
  ): Promise<boolean> {
    let success = false;
    try {
      const formData = {
        ...report.value,
        postId: post[post.length - 1].id,
      };
      //formData.severity = formData.severity.value;
      await this.http
        .post(`${environment.baseUrl}/reportPost`, formData)
        .toPromise();
      success = true;
    } catch (error) {
      console.error(error);
      //this.messages.add({ severity: 'error', summary: 'Something went wrong reporting the post! Check your internet conectivity and try again.' });
    }

    return success;
  }

  async getReportComponent(): Promise<typeof ReportPostComponent> {
    const { ReportPostComponent } = await import(
      '../components/report-post/report-post.component'
    );
    return ReportPostComponent;
  }

  async openReportPostDialog(post: ProcessedPost) {
    this.dialogService.open(await this.getReportComponent(), {
      data: { post },
      width: '100%',
    });
  }
}
