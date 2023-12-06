import { Component, Injector, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { PrimeNGConfig } from 'primeng/api';
import { createCustomElement } from '@angular/elements';
import { Router } from '@angular/router';
import { LoginService } from './services/login.service';
import { isPlatformBrowser } from '@angular/common';
import { WafrnMediaComponent } from './components/wafrn-media/wafrn-media.component';
import { WafrnYoutubePlayerComponent } from './components/wafrn-youtube-player/wafrn-youtube-player.component';


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

      const mediaElement = createCustomElement(WafrnMediaComponent, { injector: this.injector });
      customElements.define('app-wafrn-media', mediaElement);

      const youtubeElement = createCustomElement(WafrnYoutubePlayerComponent,  { injector: this.injector });
      customElements.define('app-wafrn-youtube-player', youtubeElement);

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

