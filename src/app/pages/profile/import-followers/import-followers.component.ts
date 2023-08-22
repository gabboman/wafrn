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

  responseResults: {success?: boolean, newFollows: number, alreadyFollowing: number, errors: string[], errorMessage?: string} = {
    success: undefined,
    newFollows: 0,
    alreadyFollowing: 0,
    errors: []
  }


  beforeUpload() {
    this.loading = true;
  }

  afterUpload(event: any) {
    const response = event.originalEvent.body;
    if (response.success) {
      this.responseResults.success = true;
      this.responseResults.newFollows = response.newFollows;
      this.responseResults.alreadyFollowing = response.alreadyFollowing;
      this.responseResults.errors = response.errors
    } else {
      this.responseResults.success = false;
    }
    this.loading = false;
  }
}
