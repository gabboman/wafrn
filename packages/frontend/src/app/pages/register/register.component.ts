import { Component } from '@angular/core'
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { LoginService } from 'src/app/services/login.service'
import { MessageService } from 'src/app/services/message.service'

import { faEye, faEyeSlash, faUpload, faUser } from '@fortawesome/free-solid-svg-icons'
import { EnvironmentService } from 'src/app/services/environment.service'
import { Router } from '@angular/router'

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
    'All of the above this one.',
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
    'Gay except for Bayonetta',
    'Heterosexual except for Samus Aran',
    'Sphynx of black quartz, judge my vow',
    'Small dog',
    '9th-level Fighter',
    'Big dog',
    'fallback avatar',
    'Crisp sandwich',
    'Cool rock I just found',
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
    'Heterosexual except for GODZILLA',
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
    'sans UNDERTALE',
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
    'Call me a deer the way I stare into the incoming light of a car',
    'Mile Smile',
    'NFC Compatible',
    '485.72 Hz',
    'Snake in a böx',
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
    'whatever it is, its MINE',
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
    'All the ones below this one',
    'Steam Deck compatible',
    'Here could be your ad!',
    'Comic Sans',
    'eepy',
    'caffeinated and sleep deprived',
    'Blackjack and Hookers',
    'Arch btw',
    'dumbfuck juice',
    'uoppy',
    'bnuuy',
    'kibty',
    ':3',
    'filesystem',
    'Not MS-DOS compatible',
    '01000111 01100101 01101110 01100100 01100101 01110010',
    'Electron app',
    'ISO 8601',
    'waffle',
    'pancake',
    'day',
    'week',
    'month',
    'year',
    'mailserver',
    'mailserver (evil)',
    'cinderace',
    'Is this loss?',
    'transistor-transistor logic',
    'blue hair and pronouns',
    'Acer Spin SP314 V1.08',
    'wouldn´t you like to know?',
    'Graphical User Interface',
    'CMOS battery',
    'IP over Avian Carriers',
    'wrong',
    'XKCD comic',
    'a walrus in disguise',
    '[REDACTED]',
    'publically traded',
    'dead.',
    '#1 SPORTS FAN',
    'Female representing nipple',
    'FORD F150',
    'Sparkling water',
    'Still water',
    'Magazine cover page',
    'crossword puzzle',
    '...---...',
    'uninhabitated',
    'translation issue',
    'audiophile',
    'Midnight Club 3 DUB Edition killed my PSP´s UMD drive in 2013',
    'Don´t select this gender',
    'mean girl',
    'fluffy boy',
    'Creeper',
    'Aw man',
    'I was here',
    'lava lamp',
    'commercial break',
    'dirty bus seat',
    'Blender donut tutorial',
    'Rock',
    'Paper',
    'Scissors',
    'infrared',
    'ultraviolet',
    'isopod ([[[[){',
    'basic',
    'neutral',
    'acidic',
    'defenestration',
    'dankmeme.jpg',
    '2010s survivor',
    'real',
    'imaginary',
    'complex',
    'pneumono­ultra­micro­scopic­silico­volcano­coniosis',
    'this treasure chest behind water falls',
    'noodles',
    'spray can cheese',
    'a Looney Tunes sketch',
    'Free And Open Source',
    'moth',
    'Never gonna give you up',
    'Never gonna let you down',
    'Never gonna run around',
    'And desert you',
    'Never gonna make you cry',
    'Never gonna say goodbye',
    'Never gonna tell a lie',
    'And hurt you',
    'barely surviving',
    'motivational poster',
    'Oblivion´s NPC AI',
    'Neofetch ASCII art',
    'Karen took it with the kids',
    'DELTARUNE spoilers',
    'ON SALE 50% OFF PICK THIS GENDER NOW AND GET ONE FREE',
    'No one ever would pick this one',
    'all of the above'
  ]

  loginForm = new UntypedFormGroup({
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    password: new UntypedFormControl('', [Validators.required]),
    url: new UntypedFormControl('', [Validators.required, Validators.pattern('^[a-z0-9_A-Z]+([\_-]+[a-z0-9_A-Z]+)*')]),
    description: new UntypedFormControl('', [Validators.required]),
    birthDate: new UntypedFormControl('', [Validators.required]),
    captchaResponse: new UntypedFormControl('', []),
    avatar: new UntypedFormControl('', [])
  })

  constructor(
    private loginService: LoginService,
    private messages: MessageService,
    private router: Router
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
        this.router.navigate(['/checkMail'])
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
