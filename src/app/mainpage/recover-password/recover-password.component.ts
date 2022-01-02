import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { LoginService } from 'src/app/services/login.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss']
})
export class RecoverPasswordComponent implements OnInit {



  captchaKey = environment.recaptchaPublic;
  loading = false;

  loginForm = new FormGroup({
    email:  new FormControl('', [Validators.required, Validators.email]),
    captchaResponse:  new FormControl('', [Validators.required])
  });

  constructor(
    private loginService: LoginService,
    private messageService: MessageService
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
    // TODO this and also the activate and reset password 
    console.log(this.loginForm.valid)
  }
}
