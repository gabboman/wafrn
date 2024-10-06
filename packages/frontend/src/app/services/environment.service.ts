import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  // default env
  public static environment = {
    maxUploadSize: '250',
    logo: '/assets/logo.png',
    baseUrl: '/api',
    baseMediaUrl: `${window.location.protocol}${window.location.host}/api/uploads`,
    externalCacheurl: '/api/cache?media=',
    frontUrl: `${window.location.protocol}${window.location.host}`,
    shortenPosts: 3,
    reviewRegistrations: true,
    disablePWA: false,
    maintenance: false,
  }

  constructor(
    private http: HttpClient
  ) {
    // we check if the localstorage has the environment for quicker load
    let localStorageEnv = localStorage.getItem('environment');
    if (localStorageEnv) {
      EnvironmentService.environment = JSON.parse(localStorageEnv)
    }
    firstValueFrom(this.http.get('/api/environment')).then((res: any) => {
      EnvironmentService.environment = res;
      localStorage.setItem('environment', JSON.stringify(res))
    }).catch(error => {
      console.warn()
    })
  }



}
