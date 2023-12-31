import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ProcessedPost } from '../interfaces/processed-post';
import { WafrnMedia } from '../interfaces/wafrn-media';
import { WafrnMention } from '../interfaces/wafrn-mention';
import { JwtService } from './jwt.service';
import { LoginService } from './login.service';
import { UtilsService } from './utils.service';
import { SimplifiedUser } from '../interfaces/simplified-user';

@Injectable({
  providedIn: 'root'
})
export class MediaService {


  disableNSFWFilter = false;
  constructor(
    private jwt: JwtService,
    private jwtService: JwtService,
    private http: HttpClient,

  ) {
    if (
      localStorage.getItem('disableNSFWFilter') === "true"
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

  async updateMedia(id: string, description: string, nsfw: boolean, adult: boolean) {
    let payload: HttpParams = new HttpParams();
    payload = payload.set('id', id);
    payload = payload.set('description', description);
    payload = payload.set('NSFW', nsfw);
    payload = payload.set('adultContent', adult)
    const response = await this.http.get(`${environment.baseUrl}/updateMedia`, {params: payload}).toPromise();
    return response;

  }

}
