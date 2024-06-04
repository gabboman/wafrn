import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFileUpload } from '@fortawesome/free-solid-svg-icons';
import { lastValueFrom } from 'rxjs';
import { WafrnMedia } from 'src/app/interfaces/wafrn-media';
import { MessageService } from 'src/app/services/message.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  uploading = false;
  uploadIcon = faFileUpload;
  @Input() disabled = false;
  @Input() config: {
    url: string,
    formats: string,
    buttonText: string,
    formdataName: string
  } = {
    url :`/uploadMedia`,
    formdataName: 'image',
    formats: `image/*, video/*`,
    buttonText: ``
  }
  @Output() fileUpload: EventEmitter<WafrnMedia> =
    new EventEmitter<WafrnMedia>();

  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) {}

  // DIRTY if you touch ANYTHING ELSE here you better move this to a service. UNDERSTOOD?
  // TODO undo this dirty thing, move to a service, handle errors
  async onFileSelected(event: Event) {
    this.uploading = true;
    const el = event.target as HTMLInputElement;
    const formdata = new FormData();
    if (el.files && el.files[0]) {
      formdata.append(this.config.formdataName, el.files[0]);
      const petition: WafrnMedia[] | void = await lastValueFrom(
        this.http.post<Array<WafrnMedia>>(environment.baseUrl + this.config.url, formdata)
      ).catch((error: any) => {
        console.log('error uploading');
        console.warn(error);
      });
      if (petition && petition[0]) {
        this.fileUpload.emit(petition[0]);
        this.uploading = false;
      }
    }
  }
}
