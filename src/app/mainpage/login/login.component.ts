import { Component, OnInit } from '@angular/core';
import { LoginService } from 'src/app/services/login.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  captchaKey = environment.recaptchaPublic;
  captchaValid = false;
  captchaResponse: string = '';

  constructor(
    private loginService: LoginService
  ) { }

  ngOnInit(): void {
  }

  captchaResolved(ev: any){
    this.captchaResponse = ev.response;
    this.captchaValid = true;
  }
  captchaExpired(){
    this.captchaResponse = '';
    this.captchaValid = false;
  }

}
