import { CommonModule, NgClass } from '@angular/common'
import { Component, linkedSignal, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatMenuModule } from '@angular/material/menu'
import { MatTooltipModule } from '@angular/material/tooltip'
import { FaIconComponent } from '@fortawesome/angular-fontawesome'
import { faPalette } from '@fortawesome/free-solid-svg-icons'
import { TranslateService } from '@ngx-translate/core'
import { LoginService } from 'src/app/services/login.service'

// !! NOTE FOR ADDING THEMES !! //
//
// If you want to add a theme, you must:
// - Update this type
// - Add the theme as a CSS file in `/assets/themes/name.css`
// - Add a link file to it in this component's HTML file

const colorThemeVariants = ['light', 'dark', 'auto'] as const
type ColorThemeTuple = typeof colorThemeVariants
type ColorTheme = ColorThemeTuple[number]

function isColorTheme(value: string): value is ColorTheme {
  return colorThemeVariants.includes(value as ColorTheme)
}
function isColorScheme(value: string): value is ColorScheme {
  return colorSchemeVariants.includes(value as ColorScheme)
}
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
type ColorScheme = ColorSchemeTuple[number]

function capitalize(text: string) {
  text = text[0].toUpperCase() + text.slice(1)
  return text
}

@Component({
  selector: 'app-color-scheme-switcher',
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    FaIconComponent,
    MatCheckboxModule,
    NgClass
  ],
  templateUrl: './color-scheme-switcher.component.html',
  styleUrl: './color-scheme-switcher.component.scss'
})
export class ColorSchemeSwitcherComponent {
  // Utility
  readonly variants = colorSchemeVariants
  readonly capitalize = capitalize

  defaultThemes: ColorScheme[] = ['default', 'tan', 'green', 'gold', 'red', 'pink', 'purple', 'blue']
  computeryThemes: ColorScheme[] = ['unwafrn', 'wafrnverse', 'wafrn98', 'aqua', 'fan']
  experimentalThemes: ColorScheme[] = ['rizzler', 'contrastWater']
  programmersThemes: ColorScheme[] = [
    'dracula',
    'catppuccin_frappe',
    'catppuccin_latte',
    'catppuccin_macchiato',
    'catppuccin_mocha'
  ]

  // Color scheme
  colorScheme = signal<ColorScheme>('default')
  colorSchemeText = linkedSignal(() => capitalize(this.colorScheme()))

  // Options
  centerLayoutMode = localStorage.getItem('centerLayout') === 'true'
  horizontalMenuMode = localStorage.getItem('horizontalMenu') === 'true'

  // Icons
  paletteIcon = faPalette

  // Light/Dark mode
  theme = signal<ColorTheme>(this.getTheme())
  themeText = linkedSignal(() => capitalize(this.theme()))
  iconClass = ''

  constructor(
    private loginService: LoginService,
    private translateService: TranslateService
  ) {
    const colorScheme = localStorage.getItem('colorScheme')
    if (
      colorScheme !== null &&
      colorScheme !== 'rizzler' &&
      colorScheme !== 'contrastWater' &&
      isColorScheme(colorScheme)
    ) {
      this.setColorScheme(colorScheme)
    }
    const chromeVersionForCompatibilityReasons = this.getChromeVersion()
    if (chromeVersionForCompatibilityReasons) {
      if (chromeVersionForCompatibilityReasons < 122) {
        // we force the fan theme on old browsers
        this.setColorScheme('fan')
      }
    }
    this.setTheme(this.theme())
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.updateIconTheme.bind(this))
  }

  getColorScheme(): ColorScheme {
    if (typeof localStorage !== 'undefined') {
      const localScheme = localStorage.getItem('theme')
      if (localScheme !== null && isColorScheme(localScheme)) {
        return localScheme
      }
    }
    return 'default'
  }

  async setColorScheme(scheme: ColorScheme, forceUpdate = false) {
    this.colorScheme.set(scheme)
    const forceDarkModeThemes = ['wafrn98', 'unwafrn']
    const forceLightModeThemes: string[] = []
    if (forceDarkModeThemes.includes(scheme)) {
      await this.setTheme('dark')
    }
    if (forceLightModeThemes.includes(scheme)) {
      await this.setTheme('light')
    }
    if (forceUpdate && this.loginService.checkUserLoggedIn()) {
      await this.loginService.updateUserOptions([{ name: 'wafrn.colorScheme', value: scheme }])
    }
  }

  async updateCenterLayout(forceUpdate = false) {
    this.centerLayoutMode = !this.centerLayoutMode
    if (forceUpdate && this.loginService.checkUserLoggedIn()) {
      await this.loginService.updateUserOptions([
        { name: 'wafrn.centerLayout', value: this.centerLayoutMode.toString() }
      ])
    }
  }

  async updateHorizontalMenu(forceUpdate = false) {
    this.horizontalMenuMode = !this.horizontalMenuMode
    if (forceUpdate) {
      await this.loginService.updateUserOptions([
        { name: 'wafrn.horizontalMenu', value: this.horizontalMenuMode.toString() }
      ])
    }
  }

  getTheme(): ColorTheme {
    if (typeof localStorage !== 'undefined') {
      const localTheme = localStorage.getItem('theme')
      if (localTheme !== null && isColorTheme(localTheme)) {
        return localTheme
      }
    }
    return 'auto'
  }

  async setTheme(theme: ColorTheme, forceUpdate = false) {
    this.theme.set(theme)
    document.documentElement.setAttribute('data-theme', theme)
    this.updateIconTheme()
    if (forceUpdate) {
      await this.loginService.updateUserOptions([{ name: 'wafrn.theme', value: theme }])
    }
  }

  updateIconTheme() {
    if (
      this.theme() === 'dark' ||
      (this.theme() === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      this.iconClass = 'theme-toggle--toggled'
    } else {
      this.iconClass = ''
    }
  }

  getChromeVersion() {
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)

    return raw ? parseInt(raw[2], 10) : false
  }

  setLang(lang: string) {
    this.translateService.setDefaultLang(lang)
  }
}
