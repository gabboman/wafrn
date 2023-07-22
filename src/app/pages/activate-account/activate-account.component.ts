import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from 'src/app/services/login.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-activate-account',
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.scss']
})
export class ActivateAccountComponent implements OnInit {

  logo = environment.logo;

  constructor(
    private activeRoute: ActivatedRoute,
    private loginService: LoginService
  ) { }

  ngOnInit(): void {
  }

  async activateAccount() {
    const params: any = this.activeRoute.snapshot.params;
    await this.loginService.activateAccount(params.email, params.activationCode)
  }

}
