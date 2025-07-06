import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { EnvironmentService } from 'src/app/services/environment.service'
import { LoginService } from 'src/app/services/login.service'
import { MessageService } from 'src/app/services/message.service'

@Component({
  selector: 'app-activate-account',
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.scss'],
  standalone: false
})
export class ActivateAccountComponent implements OnInit {
  logo = EnvironmentService.environment.logo
  message = 'loading'
  constructor(
    private activeRoute: ActivatedRoute,
    private loginService: LoginService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.activateAccount()
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Your email was verified'
        })
        this.message = 'Your email was verified!'
      })
      .catch((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Something went wrong'
        })
        this.message = `Something went wrong! Try again in a few minutes and if it does not work please send an email to the administrator of the instance`
      })
  }

  async activateAccount() {
    const params: any = this.activeRoute.snapshot.params
    await this.loginService.activateAccount(params.email, params.activationCode)
  }
}
