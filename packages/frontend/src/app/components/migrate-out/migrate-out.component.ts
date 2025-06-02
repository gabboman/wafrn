import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatInputModule } from '@angular/material/input'
import { UserSelectorComponent } from '../user-selector/user-selector.component'
import { LoginService } from 'src/app/services/login.service'
import { LoaderComponent } from '../loader/loader.component'

@Component({
  selector: 'app-migrate-out',
  imports: [
    CommonModule,
    MatCardModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    UserSelectorComponent,
    LoaderComponent
  ],
  templateUrl: './migrate-out.component.html',
  styleUrl: './migrate-out.component.scss'
})
export class MigrateOutComponent {
  constructor(private loginService: LoginService) {}
  message = ''
  selectedUser = ''
  loading = false
  userSelectedEvent(data: string) {
    this.selectedUser = data
  }

  async pressButton() {
    this.loading = true
    try {
      const result = await this.loginService.migrate(this.selectedUser)
      if (result) {
        this.message = result.message
      }
    } catch (error) {
      console.log(error)
      this.message = 'Something went wrong!'
    }
    this.loading = false
  }
}
