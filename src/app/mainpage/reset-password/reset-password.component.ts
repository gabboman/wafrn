import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from 'src/app/services/login.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  newPassword: string = '';

  constructor(
    private loginService: LoginService,
    private activeRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
  }

  async resetPassword() {

    const params: any = this.activeRoute.snapshot.params;
    await this.loginService.resetPassword(params.email, params.resetCode, this.newPassword)

  }

}
