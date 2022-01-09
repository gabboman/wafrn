import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  constructor(
    private router: Router
  ) { }


  tokenValid( ): boolean {

    let res = false;
    const tokenString = localStorage.getItem('authToken');
    if(tokenString){
      let token = this.decodeToken(tokenString);
      res = new Date().getTime() < token.exp * 1000;
      if(!res) {
        debugger;
        localStorage.clear();
        this.router.navigate(['/']);
      }
    }
    return res;
  }


  decodeToken(token: string) {
    const jwtData = token.split('.')[1];
    return JSON.parse(window.atob(jwtData));
  }

  getTokenData(){
    const tokenString = localStorage.getItem('authToken');
    if(tokenString) {
      return this.decodeToken(tokenString);

    } else {
      return {};
    }

  }
}
