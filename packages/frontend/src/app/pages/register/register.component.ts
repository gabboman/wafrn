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

  genders: string[] = [
    'Evil',
    'Alright, I guess...',
    'Cat',
    'Electricity',
    'Ham and cheese sandwich',
    'A stone with googly eyes',
    'Autistic robot',
    'Tomp',
    'Jeroen',
    'Kinbol',
    'Lesbian except for David Tennant',
    'Heterosexual except for Henry Cavil',
    'Sphynx of black quartz, judge my vow',
    'Small dog',
    '9th-level Fighter',
    'Big dog',
    'fallback avatar',
    'Crisp sandwich',
    'Kill <img style="max-height: 32px" src="/assets/img/monsert.png" />',
    'Everything everywhere all at once',
    'Big scary werewolf that actually has an anxiety disorder and is more scared of you than you are of it',
    'I am just testing a new font',
    'Lost my gender in the war',
    'Gravity',
    'Widsom',
    'Wizard',
    'Mage',
    'Warlock',
    '"Australian"',
    'Bean for lunch',
    'Evil Fucking Wizard',
    'Eating book pages to fix low fiber in diet',
    'Mutual Assured Headache',
    'Youve got my permission for crung and smilee',
    'The developer of this stolye MY gender',
    'I have a PR with more genders ready',
    'Default',
    'Lesbian knight',
    "I don't have one, where can I get one of those?",
    "I don't have one and I am not interested",
    'this gender is not genuine',
    'STOP CALLING ME I DONT WANT ANY OF THOSE GENDERS I AM NOT INTERESTED',
    'I fond mine in the war',
    'Unicorn',
    'Mine was programmed by Bethesa',
    'I am about to enter in a plane and Im editing wafrn code ',
    'Go to settings to activate gender',
    'scorpio',
    'Vriska',
    'The impostor from among us',
    'Fox',
    'Honk',
    'Warhammer 40k fan',
    'I am going to kill god',
    'A pumpkin full of meat would fix me',
    'Very evil',
    'Too evil',
    'Good',
    'Tod',
    'Todd',
    'Tog',
    'AMONGUS SEXO',
    "gender isn't real, it can't hurt you",
    'Yes',
    'No',
    'God',
    'Up',
    'Down',
    'Strange',
    'Charm',
    'Wait those were quark types',
    'a pale imitation',
    'Wait, you wrote widsom not wisdom before',
    'Utrechter'
  ]

  loginForm = new UntypedFormGroup({
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    password: new UntypedFormControl('', [Validators.required]),
    url: new UntypedFormControl('', [Validators.required]),
    description: new UntypedFormControl('', [Validators.required]),
    birthDate: new UntypedFormControl('', [Validators.required]),
    captchaResponse: new UntypedFormControl('', []),
    avatar: new UntypedFormControl('', [])
  })

  constructor(
    private loginService: LoginService,
    private messages: MessageService
  ) {
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
