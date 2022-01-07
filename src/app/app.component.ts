import { Component, Injector, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { WafrnMediaComponent } from './sharedWafrn/wafrn-media/wafrn-media.component';
import { createCustomElement } from '@angular/elements';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'wafrn';

  constructor(
    private primengConfig: PrimeNGConfig,
    private injector: Injector
  ) {

  }

  ngOnInit() {
    this.primengConfig.ripple = true;
    const element = createCustomElement(WafrnMediaComponent, { injector: this.injector });
    customElements.define('app-wafrn-media', element);
  }
}

