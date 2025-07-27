import { CommonModule } from '@angular/common'
import { Component, signal } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatInputModule } from '@angular/material/input'
import { EnvironmentService } from 'src/app/services/environment.service'
import { LoginService } from 'src/app/services/login.service'
@Component({
  selector: 'app-enable-bluesky',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatInputModule],
  templateUrl: './enable-bluesky.component.html',
  styleUrl: './enable-bluesky.component.scss'
})
export class EnableBlueskyComponent {
  loading = false
  password = ''

  environment = signal<any>(EnvironmentService.environment)
  constructor(
    private loginService: LoginService,
    private environmentService: EnvironmentService
  ) {
    setTimeout(() => {
      this.environment.set(EnvironmentService.environment)
    }, 500)
  }

  enableBluesky() {
    this.loading = true
    this.loginService.enableBluesky(this.password).then(() => {
      this.loading = false
    })
  }
}
