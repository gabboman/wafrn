import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatInputModule } from '@angular/material/input'
import { Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { MessageService } from 'src/app/services/message.service'
import { ThemeService } from 'src/app/services/theme.service'

@Component({
  selector: 'app-css-editor',
  imports: [MatCardModule, FormsModule, MatInputModule, MatButtonModule, TranslateModule],
  templateUrl: './css-editor.component.html',
  styleUrl: './css-editor.component.scss'
})
export class CssEditorComponent {
  ready = false
  myCSS = ''
  constructor(
    private themeService: ThemeService,
    private messages: MessageService,
    private router: Router
  ) {
    this.themeService
      .getMyThemeAsSting()
      .then((theme) => {
        this.myCSS = theme.trim()
        this.ready = true
      })
      .catch((error) => {
        console.warn(error)
        this.ready = true
      })
  }

  submit() {
    this.ready = false
    this.themeService
      .updateTheme(this.myCSS || ' ') // Backend doesn't like empty strings
      .then(() => {
        this.ready = true
        this.messages.add({
          severity: 'success',
          summary: 'Success!'
        })
        this.router.navigate(['/dashboard'])
      })
      .catch((error: any) => {
        console.error(error)
        this.ready = true
        this.messages.add({
          severity: 'error',
          summary: 'Something went wrong'
        })
      })
  }
}
