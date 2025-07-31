import { HttpEventType } from '@angular/common/http'
import { Component, EventEmitter, Output, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { faFileUpload } from '@fortawesome/free-solid-svg-icons'
import { Subscription } from 'rxjs'
import { WafrnMedia } from 'src/app/interfaces/wafrn-media'
import { EnvironmentService } from 'src/app/services/environment.service'
import { FileUploadService } from 'src/app/services/file-upload.service'

enum UploadStatus {
  Pending = 'PENDING',
  Uploading = 'UPLOADING',
  Success = 'SUCCESS',
  Error = 'ERROR'
}

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  imports: [FormsModule, FontAwesomeModule, MatButtonModule, MatProgressSpinnerModule]
})
export class FileUploadComponent {
  readonly disabled = input(false)
  readonly config = input({
    url: `/uploadMedia`,
    formdataName: 'image',
    formats: `image/*, video/*, audio/*`,
    buttonText: ``
  })
  @Output() fileUpload = new EventEmitter<WafrnMedia>()
  @Output() uploadCanceled = new EventEmitter()

  uploading = false
  uploadIcon = faFileUpload
  uploadStatus = UploadStatus.Pending
  UploadStatus = UploadStatus
  uploadProgress = 0
  uploadSubscription: Subscription | undefined

  constructor(private fileUploadService: FileUploadService) {}

  async onFileSelected(event: Event) {
    this.uploadStatus = UploadStatus.Uploading
    const el = event.target as HTMLInputElement

    if (el.files === null || el.files.length === 0) {
      this.uploadStatus = UploadStatus.Pending
      return
    }

    this.uploadSubscription = this.fileUploadService
      .uploadFile(EnvironmentService.environment.baseUrl + this.config().url, el.files[0], this.config().formdataName)
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            if (event.total === undefined) return
            this.uploadProgress = Math.round(100 * (event.loaded / event.total))
          }
          if (event.type === HttpEventType.Response) {
            const response = event.body
            this.uploadStatus = UploadStatus.Success
            if (response && response[0]) {
              this.fileUpload.emit(response[0])
              this.uploadProgress = 0
            }
          }
        },
        error: () => {
          this.uploadStatus = UploadStatus.Error
        }
      })
  }

  cancelUpload() {
    this.uploadSubscription?.unsubscribe()
    this.uploadStatus = UploadStatus.Pending
    this.uploadCanceled.emit()
  }
}
