import { Component } from '@angular/core';
import { FileUploadEvent } from 'primeng/fileupload';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-import-followers',
  templateUrl: './import-followers.component.html',
  styleUrls: ['./import-followers.component.scss']
})
export class ImportFollowersComponent {

  loading = false;
  baseUrl = environment.baseUrl;
  size = parseInt(environment.maxUploadSize)  * 1024 * 1024;


  beforeUpload() {
    this.loading = true;
  }

  afterUpload(event: any) {
    const response = event.originalEvent.body;
    if (response.success) {
      
    }
    this.loading = false;
  }
}
