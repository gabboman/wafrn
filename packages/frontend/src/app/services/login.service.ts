import { EventEmitter, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { UntypedFormGroup } from '@angular/forms'

import { UtilsService } from './utils.service'
import { JwtService } from './jwt.service'
import { PostsService } from './posts.service'
import { firstValueFrom } from 'rxjs'
import { EnvironmentService } from './environment.service'
import { MessageService } from './message.service'
import { TranslateService } from '@ngx-translate/core'
import { environment } from 'src/environments/environment'

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  public loginEventEmitter: EventEmitter<string> = new EventEmitter()
  constructor(
    private http: HttpClient,
    private router: Router,
    private utils: UtilsService,
    private jwt: JwtService,
    private postsService: PostsService,
    private messagesService: MessageService,
    private translate: TranslateService
  ) {}

  checkUserLoggedIn(): boolean {
    return this.jwt.tokenValid()
  }

  async logIn(loginForm: UntypedFormGroup): Promise<boolean> {
    let success = false
    try {
      const petition: any = await this.http
        .post(`${EnvironmentService.environment.baseUrl}/login`, loginForm.value)
        .toPromise()
      if (petition.success) {
        localStorage.setItem('authToken', petition.token)
        if (petition.mfaRequired) {
          success = true
          this.router.navigate(['/login/mfa'])
        } else {
          await this.handleSuccessfulLogin()
          success = true
        }
      }
    } catch (exception) {
      console.error(exception)
    }
    return success
  }

  async logInMfa(loginMfaForm: UntypedFormGroup): Promise<boolean> {
    let success = false
    try {
      const petition: any = await this.http
        .post(`${EnvironmentService.environment.baseUrl}/login/mfa`, loginMfaForm.value)
        .toPromise()
      if (petition.success) {
        localStorage.setItem('authToken', petition.token)
        await this.handleSuccessfulLogin()
        success = true
      }
    } catch (exception) {
      console.error(exception)
    }
    return success
  }

  logOut() {
    localStorage.clear()
    this.router.navigate(['/'])
    this.loginEventEmitter.emit('logged out')
  }

  async register(registerForm: UntypedFormGroup, img: File | null): Promise<boolean> {
    let success = false
    try {
      const payload = this.utils.objectToFormData(registerForm.value)
      if (img) {
        payload.append('avatar', img)
      }
      const petition: any = await this.http
        .post(`${EnvironmentService.environment.baseUrl}/register`, payload)
        .toPromise()
      if (petition.success) {
        success = petition.success
      }
    } catch (exception) {
      console.error(exception)
    }
    return success
  }

  async requestPasswordReset(email: string) {
    const res = false
    const payload = {
      email: email
    }
    const response: any = await this.http
      .post(`${EnvironmentService.environment.baseUrl}/forgotPassword`, payload)
      .toPromise()
    if (response?.success) {
      this.router.navigate(['/'])
    }

    return res
  }

  async resetPassword(email: string, code: string, password: string) {
    const res = false
    const payload = {
      email: email,
      code: code,
      password: password
    }
    const response: any = await this.http
      .post(`${EnvironmentService.environment.baseUrl}/resetPassword`, payload)
      .toPromise()
    if (response?.success) {
      this.router.navigate(['/'])
    }

    return res
  }

  async activateAccount(email: string, code: string) {
    const res = false
    const payload = {
      email: email,
      code: code
    }
    const response: any = await this.http
      .post(`${EnvironmentService.environment.baseUrl}/activateUser`, payload)
      .toPromise()
    if (response?.success) {
      this.router.navigate(['/'])
    }

    return res
  }

  async getUserMfaList() {
    const response: any = await this.http.get(`${EnvironmentService.environment.baseUrl}/user/mfa`).toPromise()
    if (response?.success) {
      return response.mfa
    }
    this.translate.get('profile.security.mfa.errorMessageGeneric').subscribe((res: string) => {
      this.messagesService.add({
        severity: 'error',
        summary: res
      })
    })
    return false
  }

  async deleteMfa(mfaId: string) {
    const response: any = await this.http
      .delete(`${EnvironmentService.environment.baseUrl}/user/mfa/${mfaId}`)
      .toPromise()
    if (response?.success) {
      this.translate.get('profile.security.mfa.deleteSuccess').subscribe((res: string) => {
        this.messagesService.add({
          severity: 'success',
          summary: res
        })
      })
      return true
    } else {
      this.translate.get('profile.security.mfa.errorMessageGeneric').subscribe((res: string) => {
        this.messagesService.add({
          severity: 'error',
          summary: res
        })
      })
    }
    return false
  }

  async createNewMfa(mfaForm: UntypedFormGroup): Promise<any> {
    const response: any = await this.http
      .post(`${EnvironmentService.environment.baseUrl}/user/mfa`, mfaForm.value)
      .toPromise()
    if (response?.success && response?.mfa?.id) {
      return response.mfa
    } else {
      this.translate.get('profile.security.mfa.errorMessageGeneric').subscribe((res: string) => {
        this.messagesService.add({
          severity: 'error',
          summary: res
        })
      })
    }
    return false
  }

  async verifyMfa(mfaId: string, mfaVerifyForm: UntypedFormGroup) {
    const response: any = await this.http
      .post(`${EnvironmentService.environment.baseUrl}/user/mfa/${mfaId}/verify`, mfaVerifyForm.value)
      .toPromise()
    if (response?.success) {
      this.translate.get('profile.security.mfa.verifySuccess').subscribe((res: string) => {
        this.messagesService.add({
          severity: 'success',
          summary: res
        })
      })
      return true
    } else {
      this.translate.get('profile.security.mfa.verifyFailed').subscribe((res: string) => {
        this.messagesService.add({
          severity: 'error',
          summary: res
        })
      })
    }
    return false
  }

  async updateProfile(updateProfileForm: any, img: File | undefined, headerImg: File | undefined): Promise<boolean> {
    let success = false

    const optionFormKeyMap = {
      disableNSFWFilter: 'wafrn.disableNSFWFilter',
      automaticalyExpandPosts: 'wafrn.automaticalyExpandPosts',
      disableForceAltText: 'wafrn.disableForceAltText',
      federateWithThreads: 'wafrn.federateWithThreads',
      asksLevel: 'wafrn.public.asks',
      forceClassicLogo: 'wafrn.forceClassicLogo',
      defaultPostEditorPrivacy: 'wafrn.defaultPostEditorPrivacy',
      rssOptions: 'wafrn.enableRSS',
      mutedWords: 'wafrn.mutedWords',
      superMutedWords: 'wafrn.superMutedWords',
      disableCW: 'wafrn.disableCW',
      forceClassicVideoPlayer: 'wafrn.forceClassicVideoPlayer',
      forceClassicAudioPlayer: 'wafrn.forceClassicAudioPlayer',
      disableConfetti: 'wafrn.disableConfetti',
      enableConfettiRecivingLike: 'wafrn.enableConfettiRecivingLike',
      forceClassicMediaView: 'wafrn.forceClassicMediaView',
      expandQuotes: 'wafrn.expandQuotes',
      attachments: 'fediverse.public.attachment',
      alsoKnownAs: 'fediverse.public.alsoKnownAs',
      defaultExploreLocal: 'wafrn.defaultExploreLocal',
      showNotificationsFrom: 'wafrn.notificationsFrom',
      notifyMentions: 'wafrn.notifyMentions',
      notifyReactions: 'wafrn.notifyReactions',
      notifyQuotes: 'wafrn.notifyQuotes',
      notifyFollows: 'wafrn.notifyFollows',
      notifyRewoots: 'wafrn.notifyRewoots',
      disableSounds: 'wafrn.disableSounds',
      replaceAIWithCocaine: 'wafrn.replaceAIWithCocaine',
      replaceAIWord: 'wafrn.replaceAIWord',
      hideQuotes: 'wafrn.hideQuotes'
    }

    try {
      const {
        hideProfileNotLoggedIn,
        hideFollows,
        name,
        description,
        manuallyAcceptsFollows,
        disableEmailNotifications,
        ...form
      } = updateProfileForm

      const payload = this.utils.objectToFormData({
        name,
        description,
        manuallyAcceptsFollows,
        disableEmailNotifications,
        hideFollows,
        hideProfileNotLoggedIn
      })

      const options = []
      for (const key in form) {
        if (form[key] != undefined) {
          const name = optionFormKeyMap[key as keyof typeof optionFormKeyMap]
          const value = JSON.stringify(form[key])
          options.push({ name, value })
        }
      }

      payload.append('options', JSON.stringify(options))

      if (img) {
        payload.append('avatar', img)
      }
      if (headerImg) {
        payload.append('headerImage', headerImg)
      }
      const petition: any = await firstValueFrom(
        this.http.post(`${EnvironmentService.environment.baseUrl}/editProfile`, payload)
      )
      if (petition.success) {
        success = true
        await this.postsService.loadFollowers()
      }
    } catch (exception) {
      console.error(exception)
    }
    return success
  }

  async updateUserOptions(options: { name: string; value: string }[]): Promise<boolean> {
    let success = false
    try {
      const payload: FormData = new FormData()
      const petition: any = await firstValueFrom(
        this.http.post(`${EnvironmentService.environment.baseUrl}/editOptions`, { options: options })
      )
      if (petition.success) {
        success = true
        await this.postsService.loadFollowers()
      }
    } catch (error) {
      console.error(error)
    }

    return success
  }

  async enableBluesky(password: string) {
    try {
      let result = await firstValueFrom(
        this.http.post(`${EnvironmentService.environment.baseUrl}/v2/enable-bluesky`, { password })
      )
      this.messagesService.add({ severity: 'success', summary: 'Bluesky is enabled for you!' })
    } catch (error: any) {
      const tmp = error as HttpErrorResponse
      this.messagesService.add({
        severity: 'error',
        summary: tmp.error.message ?? 'There was an error, try again or contact an administrator'
      })
    }
    return
  }

  async deleteAccount(password: string): Promise<boolean> {
    let res = false
    let message = 'Something went wrong! Is the password the correct one?'
    let body = {
      password: password
    }
    try {
      let petition = await firstValueFrom(
        this.http.post<{ success: boolean }>(`${EnvironmentService.environment.baseUrl}/user/selfDeactivate`, body)
      )
      if (petition.success) {
        res = true
      }
    } catch (error) {
      message = 'Something went wrong. Please try again or contact an administrator'
    }
    if (!res) {
      this.messagesService.add({ severity: 'error', summary: message })
    }
    return res
  }

  async handleSuccessfulLogin() {
    await this.postsService.loadFollowers()
    this.loginEventEmitter.emit('logged in')
    this.router.navigate(['/dashboard'])
  }

  getLoggedUserUUID(): string {
    const res = this.jwt.getTokenData().userId
    return res ? res : ''
  }

  getUserDefaultPostPrivacyLevel(): number {
    const res = localStorage.getItem('defaultPostEditorPrivacy')
    return res ? parseInt(res) : 0
  }

  getForceClassicLogo(): boolean {
    const res = localStorage.getItem('forceClassicLogo')
    return res == 'true'
  }

  async migrate(target: string): Promise<{ success: boolean; message: string }> {
    const res = await firstValueFrom(
      this.http.post<{ success: boolean; message: string }>(
        EnvironmentService.environment.baseUrl + '/user/migrateOut',
        { target }
      )
    )
    return res
  }
}
