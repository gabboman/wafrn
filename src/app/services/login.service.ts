import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';
@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private http: HttpClient,
    private router: Router,
    private utils: UtilsService
  ) { }

  checkUserLoggedIn():boolean {
    return localStorage.getItem('authToken') != null;
  }

  async logIn(loginForm: FormGroup): Promise<boolean> {
    let success = false;
    try{
      let petition:any = await this.http.post(environment.baseUrl + '/login', this.utils.objectToFormData(loginForm.value)).toPromise();
      if(petition.success) {
        localStorage.setItem('authToken', petition.token);
        success = true;
        this.router.navigate(['/dashboard']);
      }
    } catch (exception){
      console.error(exception);
      
    }
    return success;
  }
}
