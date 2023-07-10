import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ReplaySubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProcessedPost } from '../interfaces/processed-post';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  public launchReportScreen: ReplaySubject<Array<ProcessedPost>> = new ReplaySubject();


  constructor(
    private http: HttpClient,
    private messages: MessageService
  ) { }


  async reportPost(post: ProcessedPost[], report: UntypedFormGroup): Promise<boolean> {
    let success = false;
    try {
      const formData = {
        ... report.value,
        postId : post[post.length -1].id
      }
      formData.severity = formData.severity.value;
      const response = await this.http.post(`${environment.baseUrl}/reportPost`, formData).toPromise();
      success = true;

    } catch (error) {
      console.error(error)
      this.messages.add({ severity: 'error', summary: 'Something went wrong reporting the post! Check your internet conectivity and try again.' });


    }

    return success;

  }
}
