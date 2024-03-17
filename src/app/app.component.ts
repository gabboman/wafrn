import { Component, Injector, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { LoginService } from './services/login.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'wafrn';

  constructor(
    private swUpdate: SwUpdate,
    private injector: Injector,
    private loginService: LoginService
  ) {}

  ngOnInit() {
    // unregister serviceworkers
    /*navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (const registration of registrations) {
        registration.unregister();
      }
    });*/

    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate().then((updateAvaiable) => {
        if (
          updateAvaiable &&
          confirm(
            "You're using an old version of wafrn, do you want to update?"
          )
        ) {
          window.location.reload();
        }
        if ('caches' in window) {
          caches.keys().then(function (keyList) {
            return Promise.all(
              keyList.map(function (key) {
                return caches.delete(key);
              })
            );
          });
        }
        if (window.navigator && navigator.serviceWorker) {
          navigator.serviceWorker
            .getRegistrations()
            .then(function (registrations) {
              for (const registration of registrations) {
                registration.unregister();
              }
            });
        }
      });
    }
  }
}
