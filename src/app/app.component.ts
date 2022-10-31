import { Component, Injector, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { createCustomElement } from '@angular/elements';
import { Router } from '@angular/router';
import { LoginService } from './services/login.service';
import { isPlatformBrowser } from '@angular/common';
import { WafrnMediaComponent } from './wafrn-media/wafrn-media.component';
import { WafrnYoutubePlayerComponent } from './wafrn-youtube-player/wafrn-youtube-player.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'wafrn';

  constructor(
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
  }
}

function platformId(platformId: any) {
  throw new Error('Function not implemented.');
}

