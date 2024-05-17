import { CanActivateFn, Router } from '@angular/router';
import { JwtService } from '../services/jwt.service';
import { inject } from '@angular/core';

export const isAdminGuard: CanActivateFn = (route, state) => {
  const res = inject(JwtService).adminToken()
  if(!res) {
    inject(Router).navigate(['/'])
  }
  return res;};
