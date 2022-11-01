import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import * as Sentry from "@sentry/angular";
import { BrowserTracing } from "@sentry/tracing";

if (environment.production) {
  Sentry.init({
    dsn: "https://ec85dd660fc94a12a2b1a41bc9911f24@o4504061383802880.ingest.sentry.io/4504061385048064",
    integrations: [
      new BrowserTracing({
        tracingOrigins: ["https://app.wafrn.net", "https://api.wafrn.net"],
        routingInstrumentation: Sentry.routingInstrumentation,
      }),
    ],
  
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
  enableProdMode();
}

function bootstrap() {
  platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
};


 if (document.readyState === 'complete') {
   bootstrap();
 } else {
   document.addEventListener('DOMContentLoaded', bootstrap);
 }
 
