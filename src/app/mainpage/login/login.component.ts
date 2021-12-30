import { Component, OnInit } from '@angular/core';
import { LoginService } from 'src/app/services/login.service';
import { environment } from 'src/environments/environment';
import { FormGroup, FormControl, Validators } from '@angular/forms'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  captchaKey = environment.recaptchaPublic;
  captchaValid = false;

  loginForm = new FormGroup({
    email:  new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    captchaResponse:  new FormControl('', [Validators.required])
  });



  constructor(
    private loginService: LoginService
  ) { }

  ngOnInit(): void {
  }

  captchaResolved(ev: any){
    this.loginForm.controls['captchaResponse'].patchValue(ev.response);
    this.captchaValid = true;
  }
  captchaExpired(){
    this.loginForm.controls['captchaResponse'].patchValue(null);
    this.captchaValid = false;
  }

  onSubmit(){
    console.log(this.loginForm.valid)
  }

}
