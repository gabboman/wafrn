import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { LoginService } from 'src/app/services/login.service';
import { environment } from 'src/environments/environment';
import { ReCaptchaV3Service } from 'ng-recaptcha';

@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss']
})
export class RecoverPasswordComponent implements OnInit {



  captchaKey = environment.recaptchaPublic;
  loading = false;

  loginForm = new UntypedFormGroup({
    email:  new UntypedFormControl('', [Validators.required, Validators.email]),
    captchaResponse:  new UntypedFormControl('', [])
  });

  constructor(
    private loginService: LoginService,
    private messageService: MessageService,
    private recaptchaV3Service: ReCaptchaV3Service
  ) { }

  ngOnInit(): void {
  }


  async onSubmit(){
    this.loading = true;
    this.loginForm.controls['captchaResponse'].patchValue(await this.recaptchaV3Service.execute('recover_password').toPromise());
    await this.loginService.requestPasswordReset(this.loginForm.value.email, this.loginForm.value.captchaResponse);
    this.loading = false;
  }
}
