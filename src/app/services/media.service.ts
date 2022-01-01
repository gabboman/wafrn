import { Injectable } from '@angular/core';
import { JwtService } from './jwt.service';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class MediaService {


  disableNSFWFilter = false;

  constructor(
    private jwt: JwtService,
    private login: LoginService
  ) {
    if (
      localStorage.getItem('disableNSFWFilter') == "true"
      && this.login.checkUserLoggedIn() && this.checkAge()) {
        this.disableNSFWFilter = true;


    }
  }

  changeDisableFilterValue( newVal: boolean) {
    this.disableNSFWFilter = newVal;
    localStorage.setItem('disableNSFWFilter', newVal.toString().toLowerCase());
  } 

  checkNSFWFilterDisabled(): boolean {
    return this.disableNSFWFilter
  }
  checkAge(): boolean {
    let tokenData = this.jwt.getTokenData();
    let birthDate = new Date(tokenData.birthDate);
    let minimumBirthDate = new Date();
    minimumBirthDate.setFullYear(minimumBirthDate.getFullYear() - 18);
    return minimumBirthDate > birthDate;

  }

  


}
