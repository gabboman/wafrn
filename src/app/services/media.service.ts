import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ProcessedPost } from '../interfaces/processed-post';
import { WafrnMedia } from '../interfaces/wafrn-media';
import { WafrnMention } from '../interfaces/wafrn-mention';
import { JwtService } from './jwt.service';
import { LoginService } from './login.service';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class MediaService {


  disableNSFWFilter = false;

  mediaMap: {[id:  string]: WafrnMedia} = {};
  mentionsMap: {[id:  string]: WafrnMention} = {};

  constructor(
    private jwt: JwtService,
    //private login: LoginService,
    private jwtService: JwtService,
    private http: HttpClient,
    private utils: UtilsService,

  ) {
    if (
      localStorage.getItem('disableNSFWFilter') == "true"
      && this.jwtService.tokenValid() && this.checkAge()) {
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
    const tokenData = this.jwt.getTokenData();
    const birthDate = new Date(tokenData.birthDate);
    const minimumBirthDate = new Date();
    minimumBirthDate.setFullYear(minimumBirthDate.getFullYear() - 18);
    if( !birthDate ) {
      return false;
    }
    return minimumBirthDate > birthDate;

  }
  
  // TODO rename this component and rename this method, as due the similarities we are gona use for more stuff
  addMediaToMap(post: ProcessedPost): void {
    if(post.medias) {
      post.medias.forEach(val => {
        val.url = val.external ? val.url : environment.baseMediaUrl + val.url;
        this.mediaMap[val.id] = val;
      });
    }
    if(post.postMentionsUserRelations) {
      post.postMentionsUserRelations.forEach(val => {
        this.mentionsMap[val.userId] = val;
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
        NSFW: false,
        adultContent: false,
        external: false
      }
    }

    return res;

  }

  async updateMedia(id: string, description: string, nsfw: boolean, adult: boolean) {
    let payload: HttpParams = new HttpParams();
    payload = payload.set('id', id);
    payload = payload.set('description', description);
    payload = payload.set('NSFW', nsfw);
    payload = payload.set('adultContent', adult)
    let response = await this.http.get(environment.baseUrl + '/updateMedia', {params: payload}).toPromise();
    return response;

  }

  


}
