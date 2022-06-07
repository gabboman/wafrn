import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './mainpage/login/login.component';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CaptchaModule } from 'primeng/captcha';
import { RippleModule } from 'primeng/ripple';
import { RegisterComponent } from './mainpage/register/register.component';
import { CalendarModule } from 'primeng/calendar';
import { KeyFilterModule } from 'primeng/keyfilter';
import { TooltipModule } from 'primeng/tooltip';
import { RecoverPasswordComponent } from './mainpage/recover-password/recover-password.component';
import { WafrnAuthInterceptor } from './interceptors/wafrn-auth.interceptor';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { YouTubePlayerModule } from "@angular/youtube-player";
import { WafrnYoutubePlayerComponent } from './shared/wafrn-youtube-player/wafrn-youtube-player.component';
import { ResetPasswordComponent } from './mainpage/reset-password/reset-password.component';
import { ActivateAccountComponent } from './mainpage/activate-account/activate-account.component';
import { ViewBlogComponent } from './mainpage/view-blog/view-blog.component';
import { ViewPostComponent } from './mainpage/view-post/view-post.component';
import { SharedWafrnModule } from './sharedWafrn/shared-wafrn.module';
import {DeferModule} from 'primeng/defer';
import { CardModule } from 'primeng/card';
import { PostEditorComponent } from './mainpage/post-editor/post-editor.component';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { EditorModule } from 'primeng/editor';
import { NavigationMenuComponent } from './mainpage/navigation-menu/navigation-menu.component';
import { SpeedDialModule } from 'primeng/speeddial';
import { ChipsModule } from 'primeng/chips';
import { ReportPostComponent } from './mainpage/report-post/report-post.component';
import {ListboxModule} from 'primeng/listbox';
import { NotificationsComponent } from './mainpage/notifications/notifications.component';
import {BadgeModule} from 'primeng/badge';
import {DataViewModule} from 'primeng/dataview';
import {FileUploadModule} from 'primeng/fileupload';
import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    RecoverPasswordComponent,
    WafrnYoutubePlayerComponent,
    ResetPasswordComponent,
    ActivateAccountComponent,
    ViewBlogComponent,
    ViewPostComponent,
    PostEditorComponent,
    NavigationMenuComponent,
    ReportPostComponent,
    NotificationsComponent,
    PagenotfoundComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    InputTextModule,
    PasswordModule,
    StyleClassModule,
    ButtonModule,
    CaptchaModule,
    RippleModule,
    CalendarModule,
    KeyFilterModule,
    TooltipModule,
    ProgressSpinnerModule,
    ToastModule,
    YouTubePlayerModule,
    SharedWafrnModule,
    DeferModule,
    CardModule,
    OverlayPanelModule,
    DialogModule,
    CheckboxModule,
    EditorModule,
    SpeedDialModule,
    ChipsModule,
    ListboxModule,
    BadgeModule,
    DataViewModule,
    FileUploadModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: WafrnAuthInterceptor, multi: true },
    MessageService
  ],
  bootstrap: [AppComponent],
  exports: [
  ]
})
export class AppModule { }
