import { Component, Signal, WritableSignal } from '@angular/core'
import { AdditionalStyleMode, ColorScheme, ColorTheme, ThemeService } from '../services/theme.service'

@Component({
  selector: 'app-theme-manager',
  imports: [],
  templateUrl: './theme-manager.component.html',
  styleUrl: './theme-manager.component.scss'
})
export class ThemeManagerComponent {
  colorScheme: Signal<ColorScheme>
  theme: Signal<ColorTheme>
  additionalStyleModes: { [key in AdditionalStyleMode]: WritableSignal<boolean> }

  constructor(themeService: ThemeService) {
    this.colorScheme = themeService.colorScheme
    this.theme = themeService.theme
    this.additionalStyleModes = themeService.additionalStyleModes
  }
}
