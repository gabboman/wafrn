import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DashboardService } from 'src/app/services/dashboard.service';
import { JwtService } from 'src/app/services/jwt.service';
import { LoginService } from 'src/app/services/login.service';
import { MediaService } from 'src/app/services/media.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit {

  loading = true;
  img: File| undefined = undefined;
  editProfileForm = new UntypedFormGroup({
    description: new UntypedFormControl('', [Validators.required]),
    avatar:  new UntypedFormControl('', []),
    disableNSFWFilter:  new UntypedFormControl(false, []),
    disableGifsByDefault:  new UntypedFormControl(false, [])
  });

  constructor(
    private jwtService: JwtService,
    private dashboardService: DashboardService,
    private mediaService: MediaService,
    private loginService: LoginService,
    private messages: MessageService,
  ) { }

  async ngOnInit(): Promise<void> {
    const blogDetails = await this.dashboardService.getBlogDetails(this.jwtService.getTokenData()['url']);
    delete blogDetails['avatar'];
    this.editProfileForm.patchValue(blogDetails);
    this.editProfileForm.controls['disableNSFWFilter'].patchValue(this.mediaService.checkNSFWFilterDisabled);
    this.loading = false;
  
  }

  imgSelected(filePickerEvent: any){
    if(filePickerEvent.target.files[0]) {
      this.img = filePickerEvent.target.files[0];
    }
  }

  async onSubmit() {
    this.loading = true;
    try {
      let res = await this.loginService.updateProfile(this.editProfileForm, this.img);
      this.messages.add({severity:'success', summary:'Your profile was updated!'});
    }catch(error){
      this.messages.add({severity:'error', summary:'Something went wrong', detail:'If you know what you are doing check the console and let us know!'});
      console.error(error);
    }
    this.loading = false;
  }

}
