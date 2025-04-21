import { Injectable } from '@angular/core'
import { Router } from '@angular/router'

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  constructor(private router: Router) { }

  // you're fully logged in
  tokenValid(): boolean {
    if (this.tokenPartialValid()) {
      return this.getTokenData().userId
    }
    return false
  }

  // you're partially logged in, e.g. you still need to complete MFA.
  tokenPartialValid(): boolean {
    let res = false
    const tokenString = localStorage.getItem('authToken')
    if (tokenString) {
      const token = this.decodeToken(tokenString)
      res = new Date().getTime() < token.exp * 1000
      if (!res) {
        localStorage.clear()
      }
    }
    return res
  }

  adminToken(): boolean {
    const res = false
    if (this.tokenValid()) {
      return parseInt(this.getTokenData().role) === 10
    }
    return res
  }

  decodeToken(token: string) {
    const jwtData = token.split('.')[1]
    return JSON.parse(window.atob(jwtData))
  }

  getTokenData() {
    const tokenString = localStorage.getItem('authToken')
    if (tokenString) {
      return this.decodeToken(tokenString)
    } else {
      return {}
    }
  }
}
