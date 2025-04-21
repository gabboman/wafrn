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
    'All of the above',
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
    'I dont know and I am not deciding it now just for you',
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
    'I am a rat',
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
    'Utrechter',
    'Hopelessly addicted',
    'The cause of the hopeless addiction',
    'DEATH DEATH MURDER MURDER',
    'reference to niche internet thing goes here',
    'This gender will not operate when connected to a device which makes unauthorized copies.',
    'This gender will ONLY operate when connected to a device which makes unauthorized copies.',
    'Cat with disturbingly human lips',
    'CRINGE CULTURE MADE MANIFEST',
    '[this option intentionally left blank]',
    'Mile Smile',
    'NFC Compatible',
    "Rock 'n' Roll",
    'I prefer double quotes over single quotes',
    "Trademark Dress doesn't exist",
    'thanks for watching guys',
    'YOU ARE A TOOL.',
    'illc tryi to rerad mty pogst sbeofore postign then thx',
    'rubbies',
    'chocolate manufacturing company',
    'My glasses lens popped out again :`(',
    'RetroGamesWeDontOwn_Online.ru',
    'm',
    'Quarter Circle Forward',
    "CHOOSING THIS GENDER REDIRECTS YOU TO *EVIL* WAFRN (no it fucking doesn't)",
    'The Wafrn Gender Selection Situation Is Crazy',
    'alien that only has a surface-level understanding of human culture but thinks it knows everything',
    'PC Engine',
    'electrictricity lemonade drinker',
    'Popular Games in Arcade',
    'The Mosquitos In Your Bathroom Walls',
    'オンライン翻訳ソフトを使うバカ', // MEEEEEE :3
    'Monarch of an Isekai world',
    'Evil Genius',
    'Version 2.1 NTSC-J No CD (alternate hardware)',
    'Fanatic',
    'piles of crack cocaine meth weed drug',
    'All the ones below this one'
  ]

  loginForm = new UntypedFormGroup({
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    password: new UntypedFormControl('', [Validators.required]),
    url: new UntypedFormControl('', [Validators.required, Validators.pattern('^[a-z0-9_]+([\_-]+[a-z0-9_]+)*')]),
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
