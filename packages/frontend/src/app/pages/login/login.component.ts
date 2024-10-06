import { Component, OnInit } from '@angular/core';
import { LoginService } from 'src/app/services/login.service';

import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'src/app/services/message.service';
import { faUser, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { EnvironmentService } from 'src/app/services/environment.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loading = false;
  logo = EnvironmentService.environment.logo;
  faUser = faUser;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  showPassword = false; // Property to track password visibility

  loginForm = new UntypedFormGroup({
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    password: new UntypedFormControl('', [Validators.required]),
  });

  constructor(
    private loginService: LoginService,
    private messages: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void { }

  async onSubmit() {
    this.loading = true;
    try {
      const login = await this.loginService.logIn(this.loginForm);
      if (!login) {
        this.messages.add({
          severity: 'warn',
          summary: 'Login failed',
        });
      }
    } catch (exception) {
      console.log(exception);
      this.messages.add({
        severity: 'error',
        summary: 'Something failed!',
      });
    }
    this.loading = false;
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
