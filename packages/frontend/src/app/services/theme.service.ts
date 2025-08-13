import { Injectable, signal, WritableSignal } from '@angular/core'
import { LoginService } from './login.service'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { EnvironmentService } from './environment.service'

// !! NOTE FOR ADDING THEMES !! //
//
// If you want to add a theme, you must:
// - Add it to `colorSchemeVariants`
// - Fill out its `colorSchemeData` (name data and if the theme forces light/dark) entry
//   - Compatibility allows you to force dark/light if you need.
//   - Auto Reset makes the theme be reset to default on reload
// - Add the theme as a CSS file in `/assets/themes/name.css`
// - Add a link file to it in theme-manager.component.html
// - Add your theme to a group in `colorSchemeGroupList`

// !! NOTE FOR ADDING MODES !! //
//
// If you want to add a style mode, you must:
// - Add it to `additionalStyleModeVariants`
// - Fill out its `additionalStyleModesData`
//
// Note: This uses the raw names of the mode setting.
// DO NOT OVERRIDE OTHER LOCAL STORAGE ENTRIES! There is no check :3

const colorSchemeVariants = [
  'default',
  'tan',
  'green',
  'gold',
  'red',
  'pink',
  'purple',
  'blue',
  'rizzler',
  'contrastWater',
  'wafrn98',
  'aqua',
  'unwafrn',
  'wafrnverse',
  'dracula',
  'fan',
  'catppuccin_frappe',
  'catppuccin_latte',
  'catppuccin_macchiato',
  'catppuccin_mocha'
] as const
type ColorSchemeTuple = typeof colorSchemeVariants
export type ColorScheme = ColorSchemeTuple[number]

type ColorSchemeData = {
  [key in ColorScheme]: {
    name: string
    compatibility: 'light' | 'dark' | 'both'
    autoReset?: boolean
  }
}

export const colorSchemeData: ColorSchemeData = {
  default: { name: 'Default', compatibility: 'both' },
  tan: { name: 'Tan', compatibility: 'both' },
  green: { name: 'Green', compatibility: 'both' },
  gold: { name: 'Gold', compatibility: 'both' },
  red: { name: 'Red', compatibility: 'both' },
  pink: { name: 'Pink', compatibility: 'both' },
  purple: { name: 'Purple', compatibility: 'both' },
  blue: { name: 'Blue', compatibility: 'both' },
  rizzler: { name: 'Rizzler', compatibility: 'both', autoReset: true },
  contrastWater: { name: 'Contrast Water', compatibility: 'both', autoReset: true },
  wafrn98: { name: 'Wafrn98', compatibility: 'dark' },
  aqua: { name: 'Aqua', compatibility: 'both' },
  unwafrn: { name: 'Unwafrn', compatibility: 'dark' },
  wafrnverse: { name: 'Wafrnverse', compatibility: 'both' },
  dracula: { name: 'Dracula', compatibility: 'both' },
  fan: { name: 'Fan', compatibility: 'both' },
  catppuccin_frappe: { name: 'Catppuccin Frappe', compatibility: 'both' },
  catppuccin_latte: { name: 'Catppuccin Latte', compatibility: 'both' },
  catppuccin_macchiato: { name: 'Catppuccin Macchiato', compatibility: 'both' },
  catppuccin_mocha: { name: 'Catppuccin Mocha', compatibility: 'both' }
}

const colorSchemeGroupVariants = [
  'defaultThemes',
  'computeryThemes',
  'experimentalThemes',
  'programmersThemes'
] as const
type ColorSchemeGroupTuple = typeof colorSchemeGroupVariants
export type ColorSchemeGroup = ColorSchemeGroupTuple[number]
export type ColorSchemeGroupList = {
  [key in ColorSchemeGroup]: {
    name: string
    entries: ColorScheme[]
  }
}

export const colorSchemeGroupList: ColorSchemeGroupList = {
  defaultThemes: {
    name: 'Default theme variants',
    entries: ['default', 'tan', 'green', 'gold', 'red', 'pink', 'purple', 'blue']
  },
  computeryThemes: {
    name: 'Computery themes',
    entries: ['unwafrn', 'wafrnverse', 'wafrn98', 'aqua', 'fan']
  },
  experimentalThemes: {
    name: 'Experimental themes',
    entries: ['rizzler', 'contrastWater']
  },
  programmersThemes: {
    name: "Programmer's Favourites",
    entries: ['dracula', 'catppuccin_latte', 'catppuccin_frappe', 'catppuccin_macchiato', 'catppuccin_mocha']
  }
}

const colorThemeVariants = ['light', 'dark', 'auto'] as const
type ColorThemeTuple = typeof colorThemeVariants
export type ColorTheme = ColorThemeTuple[number]

type ColorThemeData = { [key in ColorTheme]: string }
export const colorThemeData: ColorThemeData = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto'
}

// Verifying that a theme/scheme is real
function isColorTheme(value: string): value is ColorTheme {
  return colorThemeVariants.includes(value as ColorTheme)
}

function isColorScheme(value: string): value is ColorScheme {
  return colorSchemeVariants.includes(value as ColorScheme)
}

// More styles!
const additionalStyleModeVariants = ['centerLayout', 'topToolbar', 'horizontalMenu'] as const
type AdditionalStyleModeTuple = typeof additionalStyleModeVariants
export type AdditionalStyleMode = AdditionalStyleModeTuple[number]

type AdditionalStyleModeData = {
  [key in AdditionalStyleMode]: {
    name: string
  }
}

export const additionalStyleModesData: AdditionalStyleModeData = {
  centerLayout: { name: 'Center Layout' },
  topToolbar: { name: 'Top Toolbar' },
  horizontalMenu: { name: 'Horizontal Menu' }
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public colorScheme = signal<ColorScheme>('default')
  public theme = signal<ColorTheme>('auto')
  public additionalStyleModes: { [key in AdditionalStyleMode]: WritableSignal<boolean> } = {
    centerLayout: signal(false),
    topToolbar: signal(false),
    horizontalMenu: signal(false)
  }

  constructor(
    private loginService: LoginService,
    private http: HttpClient
  ) {
    const savedScheme = localStorage?.getItem('colorScheme') ?? ''
    if (isColorScheme(savedScheme)) this.setColorScheme(savedScheme)

    const savedTheme = localStorage?.getItem('theme') ?? ''
    if (isColorTheme(savedTheme)) this.setTheme(savedTheme)

    Object.entries(this.additionalStyleModes).forEach(([mode, value]) => {
      const savedMode = localStorage?.getItem(mode) ?? 'false'
      value.set(savedMode === 'true')
    })

    // Fan theme fallback for old browsers
    const chromeVersionForCompatibilityReasons = this.getChromeVersion()
    if (chromeVersionForCompatibilityReasons && chromeVersionForCompatibilityReasons < 122) {
      // we force the fan theme on old browsers
      this.setColorScheme('fan', true)
    }
  }

  public async setColorScheme(scheme: ColorScheme, doNotSavePreference = false) {
    this.colorScheme.set(scheme)
    localStorage?.setItem('colorScheme', scheme)

    // Forced theme
    if (colorSchemeData[scheme]?.compatibility === 'light') await this.setTheme('light')
    if (colorSchemeData[scheme]?.compatibility === 'dark') await this.setTheme('dark')

    // User settings
    if (doNotSavePreference) return
    await this.loginService.updateUserOptions([{ name: 'wafrn.colorScheme', value: scheme }])
  }

  public async setTheme(theme: ColorTheme, doNotSavePreference = false) {
    this.theme.set(theme)
    document.documentElement.setAttribute('data-theme', theme)
    localStorage?.setItem('theme', theme)

    // User settings
    if (doNotSavePreference) return
    await this.loginService.updateUserOptions([{ name: 'wafrn.theme', value: theme }])
  }

  public async setAdditionalStyleMode(mode: AdditionalStyleMode, value: boolean, doNotSavePreference = false) {
    this.additionalStyleModes[mode].set(value)
    localStorage?.setItem(mode, value.toString())

    // User settings
    if (doNotSavePreference) return
    await this.loginService.updateUserOptions([{ name: `wafrn.${mode}`, value: value.toString() }])
  }

  public async toggleAdditionalStyleMode(mode: AdditionalStyleMode, doNotSavePreference = false) {
    this.setAdditionalStyleMode(mode, !this.additionalStyleModes[mode](), doNotSavePreference)
  }

  getChromeVersion() {
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)

    return raw ? parseInt(raw[2], 10) : false
  }

  // CUSTOM CSS STUFF
  setMyTheme() {
    this.setCustomCSS(this.loginService.getLoggedUserUUID())
  }

  updateTheme(newTheme: string) {
    return firstValueFrom(this.http.post(`${EnvironmentService.environment.baseUrl}/updateCSS`, { css: newTheme }))
  }

  // 0 no data 1 does not want custom css 2 accepts custom css
  hasUserAcceptedCustomThemes(): number {
    let res = 0
    try {
      const storedResponse = localStorage.getItem('acceptsCustomThemes')
      res = storedResponse ? parseInt(storedResponse) : 0
    } catch (error) {}
    return res
  }

  async checkThemeExists(theme: string): Promise<boolean> {
    let res = false
    try {
      const response = await firstValueFrom(
        this.http.get(`${EnvironmentService.environment.baseMediaUrl}/themes/${theme}.css`, {
          responseType: 'text'
        })
      )
      if (response && response.length > 0) {
        res = true
      }
    } catch (error) {}
    return res
  }

  async getMyThemeAsSting(): Promise<string> {
    let res = ''
    try {
      const themeResponse = await this.http
        .get(`${EnvironmentService.environment.baseUrl}/uploads/themes/${this.loginService.getLoggedUserUUID()}.css`, {
          responseType: 'text'
        })
        .toPromise()
      if (themeResponse && themeResponse.length > 0) {
        res = themeResponse
      }
    } catch (error) {}
    return res
  }

  setCustomCSS(themeToSet: string) {
    try {
      this.setStyle('customUserTheme', `${EnvironmentService.environment.baseUrl}/uploads/themes/${themeToSet}.css`)
    } catch (error) {}
  }

  private getLinkElementForKey(key: string) {
    return this.getExistingLinkElementByKey(key) || this.createLinkElementWithKey(key)
  }

  private getExistingLinkElementByKey(key: string) {
    return document.head.querySelector(`link[rel="stylesheet"].${this.getClassNameForKey(key)}`)
  }

  private createLinkElementWithKey(key: string) {
    const linkEl = document.createElement('link')
    linkEl.setAttribute('rel', 'stylesheet')
    linkEl.classList.add(this.getClassNameForKey(key))
    document.head.appendChild(linkEl)
    return linkEl
  }

  private getClassNameForKey(key: string) {
    return `app-${key}`
  }

  /**
   * Set the stylesheet with the specified key.
   */
  private setStyle(key: string, href: string) {
    this.getLinkElementForKey(key).setAttribute('href', href)
  }

  /**
   * Remove the stylesheet with the specified key.
   */
  private removeStyle(key: string) {
    const existingLinkElement = this.getExistingLinkElementByKey(key)
    if (existingLinkElement) {
      document.head.removeChild(existingLinkElement)
    }
  }
}
