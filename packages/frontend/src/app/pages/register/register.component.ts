import { Component } from '@angular/core'
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { LoginService } from 'src/app/services/login.service'
import { MessageService } from 'src/app/services/message.service'

import { faEye, faEyeSlash, faUpload, faUser } from '@fortawesome/free-solid-svg-icons'
import { EnvironmentService } from 'src/app/services/environment.service'

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: false
})
export class RegisterComponent {
  loading = false
  isPasswordVisible = false // Track visibility of password
  logo = EnvironmentService.environment.logo
  manuallyReview = EnvironmentService.environment.reviewRegistrations

  // Font Awesome icons
  faUser = faUser
  faEye = faEye
  faEyeSlash = faEyeSlash
  faUpload = faUpload

  minimumRegistrationDate: Date
  minDate: Date
  img: File | null = null
  selectedFileName: string = ''

  loginForm = new UntypedFormGroup({
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    password: new UntypedFormControl('', [Validators.required]),
    url: new UntypedFormControl('', [Validators.required]),
    description: new UntypedFormControl('', [Validators.required]),
    birthDate: new UntypedFormControl('', [Validators.required]),
    captchaResponse: new UntypedFormControl('', []),
    avatar: new UntypedFormControl('', [])
  })

  constructor(private loginService: LoginService, private messages: MessageService) {
    // minimum age: 14
    this.minimumRegistrationDate = new Date()
    this.minimumRegistrationDate.setFullYear(this.minimumRegistrationDate.getFullYear() - 18)
    // do not accept dates before 1900
    this.minDate = new Date()
    this.minDate.setFullYear(1900, 0, 1)
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible
  }

  async onSubmit() {
    this.loading = true
    try {
      const petition = await this.loginService.register(this.loginForm, this.img)
      if (petition) {
        this.messages.add({
          severity: 'success',
          summary: 'Success!'
        })
      } else {
        this.messages.add({
          severity: 'warn',
          summary: 'Email or url in use'
        })
        this.loading = false
      }
    } catch (exception) {
      this.messages.add({
        severity: 'error',
        summary: 'Something failed!'
      })
      this.loading = false
    }
  }

  imgSelected(ev: Event) {
    const el = ev.target as HTMLInputElement
    if (el.files?.[0]) {
      this.selectedFileName = el.files[0].name
      this.img = el.files[0]
    }
  }
}
