import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { JwtService } from './jwt.service'

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  disableNSFWFilter = false
  constructor(private jwt: JwtService, private jwtService: JwtService, private http: HttpClient) {
    if (localStorage.getItem('disableNSFWFilter') === 'true' && this.jwtService.tokenValid() && this.checkAge()) {
      this.disableNSFWFilter = true
    }
  }

  changeDisableFilterValue(newVal: boolean) {
    this.disableNSFWFilter = newVal
    localStorage.setItem('disableNSFWFilter', newVal.toString().toLowerCase())
  }

  checkNSFWFilterDisabled(): boolean {
    return this.disableNSFWFilter
  }
  checkAge(): boolean {
    const tokenData = this.jwt.getTokenData()
    const birthDate = new Date(tokenData.birthDate)
    const minimumBirthDate = new Date()
    minimumBirthDate.setFullYear(minimumBirthDate.getFullYear() - 18)
    if (!birthDate) {
      return false
    }
    return minimumBirthDate > birthDate
  }
}
