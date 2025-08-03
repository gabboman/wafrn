import { Injectable } from '@angular/core'
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http'
import { catchError, map, Observable, throwError } from 'rxjs'

import { Router } from '@angular/router'
import { EnvironmentService } from '../services/environment.service'

@Injectable()
export class WafrnAuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let authReq = req
    const token = localStorage.getItem('authToken')
    if (token != null && req.url.indexOf(EnvironmentService.environment.baseUrl) !== -1) {
      authReq = req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    } else {
      console.log({
        baseUrl: EnvironmentService.environment.baseUrl,
        petitionUr: req.url
      })
    }
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(authReq.headers)
        console.log('ERROR UNAUTHORIZED. Token: ' + token)
        if (error.status === 401) {
          localStorage.clear()
          this.router.navigate(['/register'])
        }
        return throwError(() => error)
      })
    )
  }
}
