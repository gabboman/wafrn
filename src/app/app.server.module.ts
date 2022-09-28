import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { NgxIsrModule } from 'ngx-isr'; 
@NgModule({
  imports: [
    AppModule,
    ServerModule,
    NgxIsrModule,
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
