import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {CommonModule} from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './mainpage/login/login.component';
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {PasswordModule} from 'primeng/password';
import {CheckboxModule} from 'primeng/checkbox';
import {StyleClassModule} from 'primeng/styleclass';
import {ButtonModule} from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {CaptchaModule} from 'primeng/captcha';
import {RippleModule} from 'primeng/ripple';
import { RegisterComponent } from './mainpage/register/register.component';
import {CalendarModule} from 'primeng/calendar';
import {KeyFilterModule} from 'primeng/keyfilter';
import {TooltipModule} from 'primeng/tooltip';
import { RecoverPasswordComponent } from './mainpage/recover-password/recover-password.component';
import { WafrnAuthInterceptor } from './interceptors/wafrn-auth.interceptor';
import { SharedWafrnModule } from './sharedWafrn/shared-wafrn.module';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    RecoverPasswordComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    StyleClassModule,
    ButtonModule,
    CaptchaModule,
    RippleModule,
    CalendarModule,
    KeyFilterModule,
    TooltipModule,
    SharedWafrnModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: WafrnAuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
