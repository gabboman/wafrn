import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
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


  loginForm = new UntypedFormGroup({
    email:  new UntypedFormControl('', [Validators.required, Validators.email]),
    password: new UntypedFormControl('', [Validators.required]),
    url: new UntypedFormControl('', [Validators.required]),
    description: new UntypedFormControl('', [Validators.required]),
    birthDate: new UntypedFormControl('', [Validators.required]),
    captchaResponse:  new UntypedFormControl('', [Validators.required]),
    avatar:  new UntypedFormControl('', [Validators.required])
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
    this.loginForm.controls['captchaResponse'].patchValue(ev);
  }
  captchaExpired(){
    this.loginForm.controls['captchaResponse'].patchValue(null);
  }

  async onSubmit(){
    this.loading = true;
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
    this.loading = false;
  }

  imgSelected(filePickerEvent: any){
    if(filePickerEvent.target.files[0]) {
      this.img = filePickerEvent.target.files[0];
    }
  }

}
