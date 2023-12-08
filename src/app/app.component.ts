import { Component, Injector, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { PrimeNGConfig } from 'primeng/api';
import { createCustomElement } from '@angular/elements';
import { Router } from '@angular/router';
import { LoginService } from './services/login.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'wafrn';

  constructor(
    private swUpdate: SwUpdate,
    private primengConfig: PrimeNGConfig,
    private injector: Injector,
    private loginService: LoginService
  ) {

  }

  ngOnInit() {
    this.primengConfig.ripple = true;

      if (this.swUpdate.isEnabled) {
        this.swUpdate.checkForUpdate().then((updateAvaiable) => {
          if(updateAvaiable && confirm("You're using an old version of wafrn, do you want to update?")) {
            window.location.reload();
          }
        });
      }
  }
}

function platformId(platformId: any) {
  throw new Error('Function not implemented.');
}

