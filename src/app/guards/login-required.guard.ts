import { CanActivateChildFn, Router } from '@angular/router';
import { JwtService } from '../services/jwt.service';
import { inject } from '@angular/core';

export const loginRequiredGuard: CanActivateChildFn = (childRoute, state) => {
  const res = inject(JwtService).tokenValid()
  if(!res) {
    inject(Router).navigate(['/'])
  }
  return res;
};
