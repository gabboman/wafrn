import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';

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
    maintenanceMessage: ''
  }

  constructor(
    private http: HttpClient
  ) {
    const environmentCopy: any = { ...environment }
    if (environmentCopy.forceEnvironment) {
      EnvironmentService.environment = environmentCopy.forceEnvironment
    }
    // we check if the localstorage has the environment for quicker load
    let localStorageEnv = localStorage.getItem('environment');
    if (localStorageEnv) {
      EnvironmentService.environment = JSON.parse(localStorageEnv)
    }

    firstValueFrom(this.http.get(EnvironmentService.environment.baseUrl + '/environment')).then((res: any) => {
      EnvironmentService.environment = res;
      localStorage.setItem('environment', JSON.stringify(res))
    }).catch(error => {
      console.warn()
    })
  }



}
