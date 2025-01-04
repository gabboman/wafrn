import { Component, linkedSignal, signal } from '@angular/core'
import { MatMenuModule } from '@angular/material/menu'
import { MatButtonModule } from '@angular/material/button'
import { NgClass } from '@angular/common'
import { MatTooltipModule } from '@angular/material/tooltip'

const colorThemeVariants = ['light', 'dark', 'auto'] as const
type ColorThemeTuple = typeof colorThemeVariants
type ColorTheme = ColorThemeTuple[number]

function isColorTheme(value: string): value is ColorTheme {
  return colorThemeVariants.includes(value as ColorTheme)
}

function capitalize(text: string) {
  text = text[0].toUpperCase() + text.slice(1)
  return text
}

@Component({
  selector: 'app-theme-switcher',
  imports: [NgClass, MatMenuModule, MatButtonModule, MatTooltipModule],
  templateUrl: './theme-switcher.component.html',
  styleUrl: './theme-switcher.component.scss'
})
export class ThemeSwitcherComponent {
  // Light/Dark mode
  theme = signal<ColorTheme>(this.getTheme())
  themeText = linkedSignal(() => capitalize(this.theme()))
  iconClass = ''

  constructor() {
    this.setTheme(this.theme())
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.updateIconTheme.bind(this))
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
