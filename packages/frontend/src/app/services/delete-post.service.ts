import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Observable, ReplaySubject } from 'rxjs'
import { EnvironmentService } from './environment.service'

@Injectable({
  providedIn: 'root'
})
export class DeletePostService {
  public launchDeleteScreen: ReplaySubject<string> = new ReplaySubject()

  constructor(private http: HttpClient, private dialogService: MatDialog) {}

  public deletePost(id: string): Observable<boolean> {
    let petitionData: HttpParams = new HttpParams()
    petitionData = petitionData.set('id', id)
    return this.http.delete<boolean>(`${EnvironmentService.environment.baseUrl}/deletePost`, {
      params: petitionData
    })
  }
  // you send the id of a post and you delete all the rewoots of that post that you made
  public deleteRewoots(id: string): Observable<boolean> {
    let petitionData: HttpParams = new HttpParams()
    petitionData = petitionData.set('id', id)
    return this.http.delete<boolean>(`${EnvironmentService.environment.baseUrl}/deleteRewoots`, {
      params: petitionData
    })
  }
  async getDeletePostComponent(): Promise<typeof DeletePostComponent> {
    const { DeletePostComponent } = await import('../components/delete-post/delete-post.component')
    return DeletePostComponent
  }

  async openDeletePostDialog(id: string) {
    this.dialogService.open(await this.getDeletePostComponent(), {
      data: { id },
      width: '100%'
    })
  }
}
