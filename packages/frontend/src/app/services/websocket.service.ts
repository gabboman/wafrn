import { Injectable } from '@angular/core'
import { WebSocketSubject, webSocket } from 'rxjs/webSocket'
import { EnvironmentService } from './environment.service'
import { LoginService } from './login.service'
import { DashboardService } from './dashboard.service'

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<any> | undefined

  constructor(
    private loginService: LoginService,
    private dashboardService: DashboardService
  ) {
    if (loginService.checkUserLoggedIn()) {
      this.connectSocket()
    }
  }

  connectSocket() {
    try {
      const url =
        EnvironmentService.environment.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://') +
        '/notifications/socket'
      console.log(url)
      this.socket$ = webSocket(url)
      this.socket$.subscribe((obs: { message: 'update_notifications' }) => {
        try {
          switch (obs.message) {
            case 'update_notifications': {
              this.dashboardService.scrollEventEmitter.next('scroll')
            }
          }
        } catch (error) {
          console.error(error)
        }
      })
      this.socket$.next({
        type: 'auth',
        object: localStorage.getItem('authToken') as string
      })
    } catch (error) {
      console.log('error conecting websocket')
      console.error(error)
    }
  }
}
