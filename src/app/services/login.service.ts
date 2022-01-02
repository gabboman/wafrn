import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';
import { JwtService } from './jwt.service';
@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private http: HttpClient,
    private router: Router,
    private utils: UtilsService,
    private jwt: JwtService
  ) { }

  checkUserLoggedIn(): boolean {
    return this.jwt.tokenValid();
  }

  async logIn(loginForm: FormGroup): Promise<boolean> {
    let success = false;
    try {
      let petition: any = await this.http.post(environment.baseUrl + '/login',
        this.utils.objectToFormData(loginForm.value)).toPromise();
      if (petition.success) {
        localStorage.setItem('authToken', petition.token);
        success = true;
        this.router.navigate(['/dashboard']);
      }
    } catch (exception) {
      console.error(exception);

    }
    return success;
  }

  async register(registerForm: FormGroup, img: File): Promise<boolean> {
    let success = false;
    try {
      let payload =  this.utils.objectToFormData(registerForm.value);
      payload.append('avatar', img);
      let petition: any = await this.http.post(environment.baseUrl + '/register',
       payload).toPromise();
      if (petition.success) {
        success = true;
      }
    } catch (exception) {
      console.error(exception);
    }
    return success;
  }
}
