import { CommonModule, NgClass } from '@angular/common'
import { Component, linkedSignal, Signal, signal, WritableSignal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatMenuModule } from '@angular/material/menu'
import { MatTooltipModule } from '@angular/material/tooltip'
import { FaIconComponent } from '@fortawesome/angular-fontawesome'
import { faPalette } from '@fortawesome/free-solid-svg-icons'
import { TranslateService } from '@ngx-translate/core'
import { LoginService } from 'src/app/services/login.service'
import {
  AdditionalStyleMode,
  additionalStyleModesData,
  ColorScheme,
  colorSchemeData,
  ColorTheme,
  colorThemeData,
  ThemeService
} from 'src/app/services/theme.service'

// !! NOTE FOR ADDING THEMES !! //
//
// Themes have been moved to theme-manager.component.ts though you will
// have to add them into a category in this file to actually select them
//
// See theme-manager.component.ts for full instruction

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
  colorScheme: Signal<ColorScheme>
  theme: Signal<ColorTheme>
  additionalStyleModes: { [key in AdditionalStyleMode]: WritableSignal<boolean> }

  // Data copies
  colorSchemeData = colorSchemeData
  colorThemeData = colorThemeData
  colorThemeOrder = Object.entries(colorThemeData)
  additionalStyleModesData = additionalStyleModesData
  additionalStyleModesOrder: [AdditionalStyleMode, WritableSignal<boolean>][]

  // Function copies
  setColorScheme: Function
  setTheme: Function
  toggleAdditionalStyleMode: Function

  // Theme categories
  defaultThemes: ColorScheme[] = ['default', 'tan', 'green', 'gold', 'red', 'pink', 'purple', 'blue']
  computeryThemes: ColorScheme[] = ['unwafrn', 'wafrnverse', 'wafrn98', 'aqua', 'fan']
  experimentalThemes: ColorScheme[] = ['rizzler', 'contrastWater']
  programmersThemes: ColorScheme[] = [
    'dracula',
    'catppuccin_latte',
    'catppuccin_frappe',
    'catppuccin_macchiato',
    'catppuccin_mocha'
  ]

  // Icons
  paletteIcon = faPalette

  // Light/Dark mode
  iconClass = ''

  constructor(themeService: ThemeService) {
    this.colorScheme = themeService.colorScheme
    this.theme = themeService.theme
    this.additionalStyleModes = themeService.additionalStyleModes
    this.additionalStyleModesOrder = Object.entries(this.additionalStyleModes) as [
      AdditionalStyleMode,
      WritableSignal<boolean>
    ][]

    this.setColorScheme = themeService.setColorScheme.bind(themeService)
    this.setTheme = themeService.setTheme.bind(themeService)
    this.toggleAdditionalStyleMode = themeService.toggleAdditionalStyleMode.bind(themeService)

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.updateIconTheme.bind(this))
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
