import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { LoginService } from 'src/app/services/login.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {


  captchaKey = environment.recaptchaPublic;
  loading = false;

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
    private loginService: LoginService,
    private messages: MessageService
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
      try {

        let petition = await this.loginService.register(this.loginForm, this.img);
        if(petition) {
          this.messages.add({severity:'success', summary:'Success!', detail:'Please check your email to activate your account'});
        } else {
          this.messages.add({severity:'warn', summary:'Email or url in use', detail:'Email or url already in use!'});

        }

      } catch (exception) {
        this.messages.add({severity:'error', summary:'Something failed!', detail:'Something has failed. Check your internet connection or try again later'});
      }
      

    }

  }

  imgSelected(filePickerEvent: any){
    if(filePickerEvent.target.files[0]) {
      this.img = filePickerEvent.target.files[0];
    }
  }

}
