import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { catchError, throwError } from 'rxjs'
import { WafrnMedia } from 'src/app/interfaces/wafrn-media'
import { MessageService } from 'src/app/services/message.service'

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) {}

  uploadFile(url: string, file: File, formdataName: string) {
    const formData = new FormData()
    formData.append(formdataName, file)
    return this.http.post<WafrnMedia[]>(url, formData, { reportProgress: true, observe: 'events' }).pipe(
      catchError((error) => {
        this.messageService.add({ severity: 'error', summary: 'Failed to upload.' })
        return throwError(error)
      })
    )
  }
}
