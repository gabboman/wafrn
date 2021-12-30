import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LoginService } from 'src/app/services/login.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss']
})
export class RecoverPasswordComponent implements OnInit {



  captchaKey = environment.recaptchaPublic;

  loginForm = new FormGroup({
    email:  new FormControl('', [Validators.required, Validators.email]),
    captchaResponse:  new FormControl('', [Validators.required])
  });

  constructor(
    private loginService: LoginService
  ) { }

  ngOnInit(): void {
  }

  captchaResolved(ev: any){
    this.loginForm.controls['captchaResponse'].patchValue(ev.response);
  }
  captchaExpired(){
    this.loginForm.controls['captchaResponse'].patchValue(null);
  }

  onSubmit(){
    console.log(this.loginForm.valid)
  }
}
