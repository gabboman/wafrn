import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Injectable()
export class WafrnAuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router
  ) { }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let authReq = req;
    const token = localStorage.getItem('authToken');
    if (token != null && req.url.indexOf(environment.baseUrl) !== -1) {
      authReq = req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
    }
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if(error.status === 403 || error.status === 401) {
          localStorage.clear();
          this.router.navigate(['/']);
        }
        return throwError(() => error);
      })
    )
  }
}
