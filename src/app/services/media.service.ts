import { Injectable } from '@angular/core';
import { ProcessedPost } from '../interfaces/processed-post';
import { WafrnMedia } from '../interfaces/wafrn-media';
import { JwtService } from './jwt.service';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class MediaService {


  disableNSFWFilter = false;

  mediaMap: {[id:  string]: WafrnMedia} = {};

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

  addMediaToMap(post: ProcessedPost): void {
    
    if(post.medias) {
      post.medias.forEach(val => {
        this.mediaMap[val.id] = val;
      });
    }

  }

  getMediaById(id: string): WafrnMedia {

    return this.mediaMap[id];

  }

  


}
