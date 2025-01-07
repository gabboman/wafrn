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

const colorSchemeVariants = ['default', 'tan', 'green', 'gold'] as const
type ColorSchemeTuple = typeof colorSchemeVariants
type ColorScheme = ColorSchemeTuple[number]

function isColorScheme(value: string): value is ColorScheme {
  return colorSchemeVariants.includes(value as ColorScheme)
}

function capitalize(text: string) {
  text = text[0].toUpperCase() + text.slice(1)
  return text
}

@Component({
  selector: 'app-color-scheme-switcher',
  imports: [MatMenuModule, MatButtonModule, MatTooltipModule, FaIconComponent, MatCheckboxModule],
  templateUrl: './color-scheme-switcher.component.html',
  styleUrl: './color-scheme-switcher.component.scss'
})
export class ColorSchemeSwitcherComponent {
  // Color scheme
  colorScheme = signal<ColorScheme>('default')
  colorSchemeText = linkedSignal(() => capitalize(this.colorScheme()))

  // Options
  centerLayoutMode = localStorage.getItem('centerLayout') === 'true'

  // Icons
  paletteIcon = faPalette

  constructor() {
    const colorScheme = localStorage.getItem('colorScheme')
    if (colorScheme !== null && isColorScheme(colorScheme)) {
      this.setColorScheme(colorScheme)
    }
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
    this.colorScheme.set(scheme)
    localStorage.setItem('colorScheme', scheme)
  }

  updateCenterLayout() {
    this.centerLayoutMode = !this.centerLayoutMode
    localStorage.setItem('centerLayout', this.centerLayoutMode.toString())
  }
}
