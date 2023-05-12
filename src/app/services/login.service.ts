import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';
import { JwtService } from './jwt.service';
import { PostsService } from './posts.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  public logingEventEmitter: EventEmitter<string> = new EventEmitter();
  constructor(
    private http: HttpClient,
    private router: Router,
    private utils: UtilsService,
    private jwt: JwtService,
    private postsService: PostsService
  ) { }

  checkUserLoggedIn(): boolean {
    return this.jwt.tokenValid();
  }

  async logIn(loginForm: UntypedFormGroup): Promise<boolean> {
    let success = false;
    try {
      let petition: any = await this.http.post(`${environment.baseUrl}/login`, loginForm.value).toPromise();
      if (petition.success) {
        localStorage.setItem('authToken', petition.token);
        await this.postsService.loadFollowers();
        this.logingEventEmitter.emit('logged in');
        success = true;
        this.router.navigate(['/dashboard']);
      }
    } catch (exception) {
      console.error(exception);

    }
    return success;
  }

  logOut() {
    localStorage.clear();
    this.router.navigate(['/']);
    this.logingEventEmitter.emit('logged out')
  }

  async register(registerForm: UntypedFormGroup, img: File | null): Promise<boolean> {
    let success = false;
    try {
      let payload =  this.utils.objectToFormData(registerForm.value);
      if ( img ) {
        payload.append('avatar', img);
      }
      let petition: any = await this.http.post(`${environment.baseUrl}/register`,
       payload).toPromise();
      if (petition.success) {
        success = true;
      }
    } catch (exception) {
      console.error(exception);
    }
    return success;
  }

  async requestPasswordReset(email: string) {
    const res = false;
    const payload = {
      email: email,
    }
    const response: any = await this.http.post(`${environment.baseUrl}/forgotPassword`, payload).toPromise();
    if(response?.success) {
      this.router.navigate(['/']);
    }

    return res;
  }

  async resetPassword(email: string, code: string, password: string) {
    let res = false;
    const payload = {
      email: email,
      code: code,
      password: password
    }
    let response: any = await this.http.post(`${environment.baseUrl}/resetPassword`, payload).toPromise();
    if(response?.success) {
      this.router.navigate(['/']);
    }

    return res;
  }

  async activateAccount(email: string, code: string) {
    let res = false;
    const payload = {
      email: email,
      code: code
    }
    let response: any = await this.http.post(`${environment.baseUrl}/activateUser`, payload).toPromise();
    if(response?.success) {
      this.router.navigate(['/']);
    }

    return res;
  }

  async updateProfile(updateProfileForm: UntypedFormGroup, img: File | undefined): Promise<boolean> {
    let success = false;
    try {
      let payload =  this.utils.objectToFormData(updateProfileForm.value);
      if(img){
        payload.append('avatar', img);
      }
      let petition: any = await this.http.post(`${environment.baseUrl}/editProfile`,
       payload).toPromise();
      if (petition.success) {
        success = true;
      }
    } catch (exception) {
      console.error(exception);
    }
    return success;

  }

  getLoggedUserUUID(): string {
    const res = this.jwt.getTokenData().userId;
    return res ? res : '';
  }
}
