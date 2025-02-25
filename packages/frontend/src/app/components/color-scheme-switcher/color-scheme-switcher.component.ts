import { CommonModule, NgClass } from '@angular/common'
import { Component, linkedSignal, signal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatMenuModule } from '@angular/material/menu'
import { MatTooltipModule } from '@angular/material/tooltip'
import { FaIconComponent } from '@fortawesome/angular-fontawesome'
import { faPalette } from '@fortawesome/free-solid-svg-icons'

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
const colorSchemeVariants = ['default', 'tan', 'green', 'gold', 'red', 'pink', 'fan'] as const
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

  // Color scheme
  colorScheme = signal<ColorScheme>('default')
  colorSchemeText = linkedSignal(() => capitalize(this.colorScheme()))

  // Options
  centerLayoutMode = localStorage.getItem('centerLayout') === 'true'

  // Icons
  paletteIcon = faPalette

  // Light/Dark mode
  theme = signal<ColorTheme>(this.getTheme())
  themeText = linkedSignal(() => capitalize(this.theme()))
  iconClass = ''

  constructor() {
    const colorScheme = localStorage.getItem('colorScheme')
    if (colorScheme !== null && isColorScheme(colorScheme)) {
      this.setColorScheme(colorScheme)
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

  setColorScheme(scheme: ColorScheme) {
    console.log(scheme)
    this.colorScheme.set(scheme)
    localStorage.setItem('colorScheme', scheme)
  }

  updateCenterLayout() {
    this.centerLayoutMode = !this.centerLayoutMode
    localStorage.setItem('centerLayout', this.centerLayoutMode.toString())
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

  setTheme(theme: ColorTheme) {
    this.theme.set(theme)
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
    this.updateIconTheme()
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
}
