import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { LoginService } from 'src/app/services/login.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss']
})
export class RecoverPasswordComponent implements OnInit {



  loading = false;
  logo = environment.logo;

  loginForm = new UntypedFormGroup({
    email:  new UntypedFormControl('', [Validators.required, Validators.email]),
  });

  constructor(
    private loginService: LoginService,
    private messageService: MessageService,
  ) { }

  ngOnInit(): void {
  }


  async onSubmit(){
    this.loading = true;
    await this.loginService.requestPasswordReset(this.loginForm.value.email);
    this.loading = false;
  }
}
