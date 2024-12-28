import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { firstValueFrom, map } from 'rxjs'
import { environment } from '../../environments/environment'

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

  constructor(private http: HttpClient) {
    const environmentCopy: any = { ...environment }
    if (environmentCopy.forceEnvironment) {
      this.replaceEnvironment(environmentCopy.forceEnvironment)
    }
    // we check if the localstorage has the environment for quicker load
    let localStorageEnv = localStorage.getItem('environment')
    if (localStorageEnv) {
      this.replaceEnvironment(JSON.parse(localStorageEnv))
    }

    firstValueFrom(this.http.get(EnvironmentService.environment.baseUrl + '/environment'))
      .then((res: any) => {
        if (res) {
          this.replaceEnvironment(res)
          localStorage.setItem('environment', JSON.stringify(res))
        }
      })
      .catch((error) => {
        console.warn()
      })
  }

  replaceEnvironment(newEnv: Record<string, string | number | boolean>) {
    for (const key in newEnv) {
      if (newEnv[key] !== undefined) {
        // @ts-ignore
        EnvironmentService.environment[key] = newEnv[key]
      }
    }
  }
}
