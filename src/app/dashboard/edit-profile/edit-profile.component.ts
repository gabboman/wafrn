import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
  editProfileForm = new FormGroup({
    description: new FormControl('', [Validators.required]),
    avatar:  new FormControl('', []),
    disableNSFWFilter:  new FormControl(false, []),
    disableGifsByDefault:  new FormControl(false, [])
  });

  constructor(
    private jwtService: JwtService,
    private dashboardService: DashboardService,
    private mediaService: MediaService,
    private loginService: LoginService,
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
    let res = await this.loginService.updateProfile(this.editProfileForm, this.img);
    console.log(res);
  }

}
