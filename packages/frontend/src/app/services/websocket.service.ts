import { Injectable } from '@angular/core'
import { WebSocketSubject, webSocket } from 'rxjs/webSocket'
import { EnvironmentService } from './environment.service'
import { LoginService } from './login.service'
import { DashboardService } from './dashboard.service'
import { retry, Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$!: WebSocketSubject<any>
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
      const onSocketConnect = new Subject()
      const url =
        EnvironmentService.environment.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://') +
        '/notifications/socket'
      this.socket$ = webSocket({
        url: url,
        WebSocketCtor: WebSocket,
        openObserver: onSocketConnect,
        protocol: 'server'
      })
      this.socket$
        .pipe(
          retry({
            delay: 3000
          })
        )
        .subscribe((obs: { message: 'update_notifications' }) => {
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
      if (this.socket$) {
      }
      onSocketConnect.subscribe((data) => {
        this.socket$.next({
          type: 'auth',
          object: localStorage.getItem('authToken') as string
        })
        this.dashboardService.scrollEventEmitter.next('scroll')
      })
    } catch (error) {
      console.error('error conecting websocket')
      console.error(error)
    }
  }
}
