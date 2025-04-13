import { CanActivateFn, Router } from '@angular/router'
import { JwtService } from '../services/jwt.service'
import { inject } from '@angular/core'

// This guard checks if the user is logged in and blocks them to go to the login and register pages
export const userLoggedGuard: CanActivateFn = (route, state) => {
  const res = !inject(JwtService).tokenValid()
  if (!res) {
    let target = localStorage.getItem('defaultExploreLocal') == 'true' ? '/dashboard/exploreLocal' : '/dashboard'
    inject(Router).navigate([target])
  }
  return res
}
