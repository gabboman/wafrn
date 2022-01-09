import { Component, Injector, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { WafrnMediaComponent } from './sharedWafrn/wafrn-media/wafrn-media.component';
import { createCustomElement } from '@angular/elements';
import { WafrnYoutubePlayerComponent } from './shared/wafrn-youtube-player/wafrn-youtube-player.component';
import { Router } from '@angular/router';

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

