import { Component } from '@angular/core'
import { FormControl, UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { EnvironmentService } from 'src/app/services/environment.service'
import { LoginService } from 'src/app/services/login.service'
import { MessageService } from 'src/app/services/message.service'
import { TranslateService } from '@ngx-translate/core'
import encodeQR from 'qr';

@Component({
  selector: 'app-mfa-setup',
  templateUrl: './mfa-setup.component.html',
  styleUrls: ['./mfa-setup.component.scss'],
  standalone: false
})
export class MfaSetupComponent {
  loading = false
  logo = EnvironmentService.environment.logo
  icon = faUser
  mfaList: any[] | null = null

  mfaForm = new UntypedFormGroup({
    type: new UntypedFormControl('totp', [Validators.required]),
    name: new UntypedFormControl('', [Validators.required])
  })

  mfaVerifyDetails: any = null
  mfaVerifyQrCode: any = null

  mfaVerifyForm = new UntypedFormGroup({
    token: new UntypedFormControl('', [Validators.required])
  })

  constructor(
    private loginService: LoginService,
    private messageService: MessageService,
    private translateService: TranslateService
  ) { }

  async ngOnInit() {
    this.mfaList = await this.loginService.getUserMfaList()
  }

  async onSubmit() {
    this.loading = true
    if (!this.mfaVerifyDetails) {
      this.mfaVerifyDetails = await this.loginService.createNewMfa(this.mfaForm)
      const imageData = encodeQR(this.mfaVerifyDetails?.qrString, 'svg');
      this.mfaVerifyQrCode = 'data:image/svg+xml;base64,' + btoa(imageData)
    } else {
      let success = await this.loginService.verifyMfa(this.mfaVerifyDetails.id, this.mfaVerifyForm)
      if (success) {
        this.mfaVerifyDetails = null
        this.mfaList = await this.loginService.getUserMfaList()
        this.mfaForm.reset()
        this.mfaVerifyForm.reset()
      }
    }
    this.loading = false
  }

  async deleteMfa(mfa: any) {
    this.translateService.get('profile.security.mfa.confirmDeleteMessage').subscribe(async (res: string) => {
      if (confirm(res)) {
        await this.loginService.deleteMfa(mfa.id)
        this.mfaList = await this.loginService.getUserMfaList()
      }
    })

  }
}
