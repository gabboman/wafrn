import { Component, computed, OnInit, signal, Signal, ViewChild, WritableSignal } from '@angular/core'
import { FormControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { EmojiCollectionsComponent } from 'src/app/components/emoji-collections/emoji-collections.component'
import { BlogDetails } from 'src/app/interfaces/blogDetails'
import { Emoji } from 'src/app/interfaces/emoji'
import { SimplifiedUser } from 'src/app/interfaces/simplified-user'
import { DashboardService } from 'src/app/services/dashboard.service'
import { JwtService } from 'src/app/services/jwt.service'
import { LoginService } from 'src/app/services/login.service'
import { MediaService } from 'src/app/services/media.service'
import { MessageService } from 'src/app/services/message.service'
import {
  AdditionalStyleMode,
  additionalStyleModesData,
  ColorScheme,
  colorSchemeData,
  ColorSchemeGroupList,
  colorSchemeGroupList,
  ColorTheme,
  colorThemeData,
  ThemeService
} from 'src/app/services/theme.service'
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  standalone: false
})
export class EditProfileComponent implements OnInit {
  loading = true
  img: File | undefined = undefined
  headerImg: File | undefined = undefined
  privacyOptions = [
    { level: 0, name: 'Public' },
    { level: 1, name: 'Followers only' },
    { level: 2, name: 'This instance only' },
    { level: 3, name: 'Unlisted' }
  ]
  askOptions = [
    { level: 1, name: 'Allow anon asks' },
    { level: 2, name: 'Only allow asks from identified users' },
    { level: 3, name: 'Disable asks' }
  ]
  rssOptions = [
    { level: 0, name: 'No' },
    { level: 1, name: 'Only articles (Feature still in the works)' },
    { level: 2, name: 'Yes for all my posts' }
  ]

  selectedIndex: WritableSignal<number> = signal<number>(0)
  tabsToHideUpdateButton = [4, 5, 6] // we do a little trolling
  showUpdateButton: Signal<boolean> = computed(() => this.tabsToHideUpdateButton.indexOf(this.selectedIndex()) === -1)

  faPlus = faPlus
  faMinus = faXmark
  @ViewChild(EmojiCollectionsComponent) emojiCollections!: EmojiCollectionsComponent

  fediAttachments: { name: string; value: string }[] = [{ name: '', value: '' }]
  editProfileForm = new UntypedFormGroup({
    avatar: new UntypedFormControl('', []),
    name: new FormControl('', Validators.required),
    disableNSFWFilter: new UntypedFormControl(false, []),
    disableGifsByDefault: new UntypedFormControl(false, []),
    defaultPostEditorPrivacy: new UntypedFormControl(false, []),
    rssOptions: new UntypedFormControl(false, []),
    asksLevel: new UntypedFormControl(2, []),
    description: new FormControl('', Validators.required),
    federateWithThreads: new FormControl(false),
    alsoKnownAs: new FormControl(''),
    disableForceAltText: new FormControl(false),
    forceClassicLogo: new FormControl(false),
    manuallyAcceptsFollows: new FormControl(false),
    hideFollows: new FormControl(false),
    hideProfileNotLoggedIn: new FormControl(false),
    forceOldEditor: new FormControl(false),
    mutedWords: new FormControl(''),
    superMutedWords: new FormControl(''),
    disableCW: new FormControl(false),
    forceClassicAudioPlayer: new FormControl(false),
    forceClassicVideoPlayer: new FormControl(false),
    disableConfetti: new FormControl(false),
    enableConfettiRecivingLike: new FormControl(false),
    disableSounds: new FormControl(false),
    forceClassicMediaView: new FormControl(false),
    expandQuotes: new FormControl(false),
    defaultExploreLocal: new FormControl(false),
    automaticalyExpandPosts: new FormControl(false),
    disableEmailNotifications: new FormControl(false),
    showNotificationsFrom: new FormControl(1),
    notifyMentions: new FormControl(true),
    notifyReactions: new FormControl(true),
    notifyQuotes: new FormControl(true),
    notifyFollows: new FormControl(true),
    notifyRewoots: new FormControl(true),
    replaceAIWithCocaine: new FormControl(false),
    replaceAIWord: new FormControl('cocaine'),
    hideQuotes: new FormControl(1)
  })

  password = ''

  survivedCount = 0
  survivedTextList: number[] = []
  survivedTimeout: ReturnType<typeof setTimeout> | undefined
  lockout = false

  colorScheme: Signal<ColorScheme>
  colorSchemeSelect = ''
  theme: Signal<ColorTheme>
  themeSelect = ''
  additionalStyleModes: { [key in AdditionalStyleMode]: WritableSignal<boolean> }
  additionalStyleModesSelect: AdditionalStyleMode[]

  // Data copies
  colorSchemeData = colorSchemeData
  colorThemeData = colorThemeData
  additionalStyleModesData = additionalStyleModesData

  // Function copies
  setColorScheme: Function
  setTheme: Function
  setAdditionalStyleMode: Function

  // Theme categories
  colorSchemeGroupList: ColorSchemeGroupList

  constructor(
    private jwtService: JwtService,
    private dashboardService: DashboardService,
    private mediaService: MediaService,
    private loginService: LoginService,
    private messages: MessageService,
    private themeService: ThemeService
  ) {
    this.colorScheme = themeService.colorScheme
    this.colorSchemeSelect = this.colorScheme()
    this.theme = themeService.theme
    this.themeSelect = this.theme()
    this.additionalStyleModes = themeService.additionalStyleModes
    this.additionalStyleModesSelect = Object.entries(this.additionalStyleModes)
      .filter(([_, enabled]) => enabled())
      .map(([val, _]) => val) as AdditionalStyleMode[]

    this.setColorScheme = themeService.setColorScheme.bind(themeService)
    this.setTheme = themeService.setTheme.bind(themeService)
    this.setAdditionalStyleMode = themeService.setAdditionalStyleMode.bind(themeService)

    this.colorSchemeGroupList = colorSchemeGroupList

    this.themeService.setCustomCSS('')
  }

  syncColorScheme() {
    this.setColorScheme(this.colorSchemeSelect)
  }

  syncTheme() {
    this.setTheme(this.themeSelect)
  }

  syncAdditionalStyleModes() {
    const allModes = Object.keys(this.additionalStyleModesData) as AdditionalStyleMode[]
    const enabledModes = this.additionalStyleModesSelect
    const disabledModes = allModes.filter((mode) => !this.additionalStyleModesSelect.includes(mode))
    enabledModes.forEach((mode) => this.setAdditionalStyleMode(mode, true))
    disabledModes.forEach((mode) => this.setAdditionalStyleMode(mode, false))
  }

  ngOnInit(): void {
    this.dashboardService.getBlogDetails(this.jwtService.getTokenData()['url'], true).then(async (blogDetails) => {
      blogDetails['avatar'] = ''
      this.editProfileForm.patchValue(blogDetails)
      if (blogDetails.descriptionMarkdown) {
        this.editProfileForm.controls['description'].patchValue(blogDetails.descriptionMarkdown)
      }
      this.editProfileForm.controls['disableNSFWFilter'].patchValue(this.mediaService.checkNSFWFilterDisabled())
      this.editProfileForm.controls['defaultPostEditorPrivacy'].patchValue(
        this.loginService.getUserDefaultPostPrivacyLevel()
      )
      let rssOptionValue = localStorage.getItem('enableRSS')
      this.editProfileForm.controls['rssOptions'].patchValue(rssOptionValue ? parseInt(rssOptionValue) : 0)
      this.editProfileForm.controls['forceClassicLogo'].patchValue(this.loginService.getForceClassicLogo())
      const federateWithThreads = localStorage.getItem('federateWithThreads')
      this.editProfileForm.controls['federateWithThreads'].patchValue(federateWithThreads === 'true')
      const disableForceAltText = localStorage.getItem('disableForceAltText')
      this.editProfileForm.controls['disableForceAltText'].patchValue(disableForceAltText === 'true')
      const forceOldEditor = localStorage.getItem('forceOldEditor') === 'true'
      this.editProfileForm.controls['forceOldEditor'].patchValue(forceOldEditor)
      const publicOptions = blogDetails.publicOptions
      const alsoKnownAs = publicOptions.find((elem) => elem.optionName == 'fediverse.public.alsoKnownAs')
      try {
        this.editProfileForm.controls['alsoKnownAs'].patchValue(JSON.parse(alsoKnownAs?.optionValue || ''))
      } catch (_) {}
      const askLevel = publicOptions.find((elem) => elem.optionName == 'wafrn.public.asks')
      this.editProfileForm.controls['asksLevel'].patchValue(askLevel ? parseInt(askLevel.optionValue) : 2)
      this.editProfileForm.controls['forceClassicAudioPlayer'].patchValue(
        this.mediaService.checkForceClassicAudioPlayer()
      )
      this.editProfileForm.controls['forceClassicVideoPlayer'].patchValue(
        this.mediaService.checkForceClassicVideoPlayer()
      )
      this.editProfileForm.controls['disableConfetti'].patchValue(localStorage.getItem('disableConfetti') == 'true')
      this.editProfileForm.controls['enableConfettiRecivingLike'].patchValue(
        localStorage.getItem('enableConfettiRecivingLike') == 'true'
      )
      this.editProfileForm.controls['disableSounds'].patchValue(localStorage.getItem('disableSounds') == 'true')

      this.editProfileForm.controls['forceClassicMediaView'].patchValue(
        localStorage.getItem('forceClassicMediaView') == 'true'
      )
      this.editProfileForm.controls['expandQuotes'].patchValue(localStorage.getItem('expandQuotes') == 'true')

      this.editProfileForm.controls['defaultExploreLocal'].patchValue(
        localStorage.getItem('defaultExploreLocal') == 'true'
      )
      this.editProfileForm.controls['replaceAIWithCocaine'].patchValue(
        localStorage.getItem('replaceAIWithCocaine') == 'true'
      )

      this.editProfileForm.controls['replaceAIWord'].patchValue(
        localStorage.getItem('replaceAIWord') ? JSON.parse(localStorage.getItem('replaceAIWord') as string) : 'cocaine'
      )

      const mutedWords = localStorage.getItem('mutedWords')
      if (mutedWords && mutedWords.trim().length) {
        try {
          this.editProfileForm.controls['mutedWords'].patchValue(JSON.parse(mutedWords))
        } catch (error) {
          this.messages.add({ severity: 'error', summary: 'Something wrong with your muted words!' })
        }
      }
      const superMutedWords = localStorage.getItem('superMutedWords')
      if (superMutedWords && superMutedWords.trim().length) {
        try {
          this.editProfileForm.controls['superMutedWords'].patchValue(JSON.parse(superMutedWords))
        } catch (error) {
          this.messages.add({ severity: 'error', summary: 'Something wrong with your superMuted words!' })
        }
      }
      const disableCW = localStorage.getItem('disableCW') == 'true'
      this.editProfileForm.controls['disableCW'].patchValue(disableCW)
      const fediAttachments = blogDetails.publicOptions.find(
        (elem) => elem.optionName === 'fediverse.public.attachment'
      )
      this.editProfileForm.controls['automaticalyExpandPosts'].patchValue(
        localStorage.getItem('automaticalyExpandPosts') === 'true'
      )
      if (fediAttachments) {
        try {
          this.fediAttachments = JSON.parse(fediAttachments.optionValue)
        } catch (error) {}
      }
      const localStorageNotificationsFrom = localStorage.getItem('notificationsFrom')
      if (localStorageNotificationsFrom) {
        this.editProfileForm.controls['showNotificationsFrom'].patchValue(parseInt(localStorageNotificationsFrom))
      }
      const localStorageNotifyQuotes = localStorage.getItem('notifyQuotes')
      if (localStorageNotificationsFrom) {
        this.editProfileForm.controls['notifyQuotes'].patchValue(localStorageNotifyQuotes == 'true')
      }
      const localStorageNotifyMentions = localStorage.getItem('notifyMentions')
      if (localStorageNotificationsFrom) {
        this.editProfileForm.controls['notifyMentions'].patchValue(localStorageNotifyMentions == 'true')
      }
      const localStorageNotifyReactions = localStorage.getItem('notifyReactions')
      if (localStorageNotificationsFrom) {
        this.editProfileForm.controls['notifyReactions'].patchValue(localStorageNotifyReactions == 'true')
      }

      const localStorageNotifyFollows = localStorage.getItem('notifyFollows')
      if (localStorageNotifyFollows) {
        this.editProfileForm.controls['notifyFollows'].patchValue(localStorageNotifyFollows == 'true')
      }

      const localStorageNotifyRewoots = localStorage.getItem('notifyRewoots')
      if (localStorageNotifyRewoots) {
        this.editProfileForm.controls['notifyRewoots'].patchValue(localStorageNotifyRewoots == 'true')
      }

      const localStorageHideQuotes = localStorage.getItem('hideQuotes')
      if (localStorageHideQuotes) {
        this.editProfileForm.controls['hideQuotes'].patchValue(parseInt(localStorageHideQuotes))
      }

      this.loading = false
    })
  }

  imgSelected(filePickerEvent: any) {
    if (filePickerEvent.target.files[0]) {
      this.img = filePickerEvent.target.files[0]
    }
  }

  headerImgSelected(filePickerEvent: any) {
    if (filePickerEvent.target.files[0]) {
      this.headerImg = filePickerEvent.target.files[0]
    }
  }

  async onSubmit() {
    this.loading = true
    try {
      const res = await this.loginService.updateProfile(
        { ...this.editProfileForm.value, attachments: this.getAttachmentValue() },
        this.img,
        this.headerImg
      )

      this.messages.add({
        severity: 'success',
        summary: 'Your profile was updated!'
      })
    } catch (error) {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong'
      })
      console.error(error)
    }
    this.loading = false
  }

  emojiClicked(emoji: Emoji) {
    navigator.clipboard.writeText(' ' + emoji.name + ' ')
    this.messages.add({
      severity: 'success',
      summary: `The emoji ${emoji.name} was copied to your clipboard`
    })
  }

  addFediAttachment() {
    this.fediAttachments.push({ name: '', value: '' })
  }

  removeFediAttachment(index: number) {
    this.fediAttachments.splice(index, 1)
  }

  getAttachmentValue() {
    return this.fediAttachments.filter((elem) => elem.name && elem.value)
  }

  async requestDeleteAccount() {
    this.loading = true
    let success = await this.loginService.deleteAccount(this.password)
    if (success) {
      this.messages.add({ severity: 'success', summary: 'goodbye' })
      setTimeout(() => {
        this.loginService.logOut()
        window.location.reload()
      }, 1000)
    }
  }

  userAliasSelected(data: string) {
    this.editProfileForm.controls['alsoKnownAs'].patchValue(data)
  }

  forceFixEmoji() {
    this.emojiCollections.updateDimensions()
  }

  rollToDie() {
    // SECURE AND COMPLETELY RANDOMIZED DEATH CHANCE!!!
    const crypto = window.crypto || window.Crypto
    const randArr = new Uint32Array(1)
    crypto.getRandomValues(randArr)
    const randomNumber = randArr[0]
    if (randomNumber % 6 === 0) {
      this.lockout = true
      return
    }

    if (this.survivedTimeout) clearTimeout(this.survivedTimeout)
    this.survivedTimeout = setTimeout(() => (this.survivedTextList = []), 2000)

    this.survivedTextList.push(this.survivedCount)
    this.survivedCount += 1
  }
}
