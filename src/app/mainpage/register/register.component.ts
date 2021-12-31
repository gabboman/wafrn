import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LoginService } from 'src/app/services/login.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {


  captchaKey = environment.recaptchaPublic;

  minimumRegistrationDate: Date;
  img: File|null = null;


  loginForm = new FormGroup({
    email:  new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    url: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    birthDate: new FormControl('', [Validators.required]),
    captchaResponse:  new FormControl('', [Validators.required]),
    avatar:  new FormControl('', [Validators.required])
  });



  constructor(
    private loginService: LoginService
  ) {
    // minimum age: 14
    this.minimumRegistrationDate = new Date();
    this.minimumRegistrationDate.setFullYear(this.minimumRegistrationDate.getFullYear() - 14);
   }

  ngOnInit(): void {
  }

  captchaResolved(ev: any){
    this.loginForm.controls['captchaResponse'].patchValue(ev.response);
  }
  captchaExpired(){
    this.loginForm.controls['captchaResponse'].patchValue(null);
  }

  async onSubmit(){
    if(this.img){
      let tmp = await this.loginService.register(this.loginForm, this.img);
      console.log(tmp)
    }

  }

  imgSelected(filePickerEvent: any){
    if(filePickerEvent.target.files[0]) {
      this.img = filePickerEvent.target.files[0];
    }
  }

}
