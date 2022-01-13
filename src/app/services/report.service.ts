import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  public launchReportScreen: BehaviorSubject<string> = new BehaviorSubject('');


  constructor(
    private http: HttpClient
  ) { }


  async reportPost(id: string, severity: number, description: string): Promise<boolean> {
    let success = false;
    try {
      const formData: FormData = new FormData();
  
      let response = await this.http.post(environment.baseUrl + '/reportPost', formData).toPromise();
      success = true;

    } catch (error) {
      console.log(error)

    }

    return success;

  }
}
