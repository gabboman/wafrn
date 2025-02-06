import { Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { LoginService } from 'src/app/services/login.service'
@Component({
  selector: 'app-enable-bluesky',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './enable-bluesky.component.html',
  styleUrl: './enable-bluesky.component.scss'
})
export class EnableBlueskyComponent {
  loading = false
  constructor(private loginService: LoginService) {}

  enableBluesky() {
    this.loading = true
    this.loginService.enableBluesky().then(() => {
      this.loading = false
    })
  }
}
