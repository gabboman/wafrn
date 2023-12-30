import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DeletePostService {
  public launchDeleteScreen: ReplaySubject<string> = new ReplaySubject();

  constructor(private http: HttpClient) {}

  public deletePost(id: string): Observable<boolean> {
    let petitionData: HttpParams = new HttpParams();
    petitionData = petitionData.set('id', id);
    return this.http.delete<boolean>(`${environment.baseUrl}/deletePost`, {
      params: petitionData,
    });
  }

  async getDeletePostComponent(): Promise<typeof DeletePostComponent> {
    const { DeletePostComponent } = await import(
      '../components/delete-post/delete-post.component'
    );
    return DeletePostComponent;
  }
}
