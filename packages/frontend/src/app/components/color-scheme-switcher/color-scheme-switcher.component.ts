import { CommonModule, NgClass } from '@angular/common'
import { Component, Signal, WritableSignal } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatMenuModule } from '@angular/material/menu'
import { MatTooltipModule } from '@angular/material/tooltip'
import { FaIconComponent } from '@fortawesome/angular-fontawesome'
import { faPalette } from '@fortawesome/free-solid-svg-icons'
import {
  AdditionalStyleMode,
  additionalStyleModesData,
  ColorScheme,
  colorSchemeData,
  colorSchemeGroupList,
  ColorSchemeGroupList,
  ColorTheme,
  colorThemeData,
  ThemeService
} from 'src/app/services/theme.service'

// !! NOTE FOR ADDING THEMES !! //
//
// Themes have been moved to theme-manager.component.ts and are now fully data!

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
  additionalStyleModesData = additionalStyleModesData

  // Function copies
  setColorScheme: Function
  setTheme: Function
  toggleAdditionalStyleMode: Function

  // Theme categories
  colorSchemeGroupList: ColorSchemeGroupList

  // Icons
  paletteIcon = faPalette

  // Light/Dark mode
  iconClass = ''

  constructor(themeService: ThemeService) {
    this.colorScheme = themeService.colorScheme
    this.theme = themeService.theme
    this.additionalStyleModes = themeService.additionalStyleModes

    this.setColorScheme = themeService.setColorScheme.bind(themeService)
    this.setTheme = themeService.setTheme.bind(themeService)
    this.toggleAdditionalStyleMode = themeService.toggleAdditionalStyleMode.bind(themeService)

    this.colorSchemeGroupList = colorSchemeGroupList

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
