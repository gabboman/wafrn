import { Component } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { LoginService } from 'src/app/services/login.service'

@Component({
  selector: 'app-home-redirector',
  imports: [],
  templateUrl: './home-redirector.component.html',
  styleUrl: './home-redirector.component.scss'
})
export class HomeRedirectorComponent {
  constructor(
    private loginService: LoginService,
    private router: Router
  ) {
    if (!loginService.checkUserLoggedIn()) {
      this.router.navigate(['/dashboard/exploreLocal'])
    }
  }
}
