import { APP_INITIALIZER, ErrorHandler, NgModule } from "@angular/core";import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { KeyFilterModule } from 'primeng/keyfilter';
import { WafrnAuthInterceptor } from './interceptors/wafrn-auth.interceptor';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from 'src/environments/environment';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha';
import { Router } from "@angular/router";
import * as Sentry from "@sentry/angular";
import { NavigationMenuModule } from "./mainpage/navigation-menu/navigation-menu.module";
import { NotificationsModule } from "./mainpage/notifications/notifications.module";
import { PostEditorModule } from "./mainpage/post-editor/post-editor.module";
import { ReportPostModule } from "./mainpage/report-post/report-post.module";

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    NavigationMenuModule,
    NotificationsModule,
    PostEditorModule,
    ReportPostModule,
    BrowserAnimationsModule,
    RecaptchaV3Module,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CalendarModule,
    KeyFilterModule,
    ToastModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: WafrnAuthInterceptor, multi: true },
    MessageService,
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.recaptchaPublic,
    },
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: true,
      }),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
  exports: [
  ]
})
export class AppModule { }
