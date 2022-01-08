import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
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
        val.url = environment.baseMediaUrl + val.url;
        this.mediaMap[val.id] = val;
      });
    }

  }

  getMediaById(id: string): WafrnMedia {

    let res =  this.mediaMap[id];

    if (!res) {
      res = {
        id: id,
        url: '/assets/img/404.png',
        description: 'The media that you are looking for could not be found. The identifier is wrong. The image is the default 404 that wafrn uses. A stock image for 404. The developer has not thought too much into it, and actually has spend more time writing this message than actually searching for a good 404 image',
        NSFW: false
      }
    }

    return res;

  }

  


}
