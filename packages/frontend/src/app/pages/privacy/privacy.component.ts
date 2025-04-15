import { Component, OnInit } from '@angular/core'
import { EnvironmentService } from 'src/app/services/environment.service'
import { SimpleSeoService } from 'src/app/services/simple-seo.service'
import { UtilsService } from 'src/app/services/utils.service'

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  standalone: false
})
export class PrivacyComponent implements OnInit {
  logo = EnvironmentService.environment.logo
  blockedServers: string[] = []
  loaded = false
  loading = false

  constructor(
    private seo: SimpleSeoService,
    private utilsService: UtilsService
  ) {}

  ngOnInit(): void {
    this.seo.setSEOTags(
      'Wafrn Privacy Policy, rules and blocked servers',
      'The wafrn privacy policy, rules and blocked servers',
      'The wafrn team',
      '/assets/linkpreview.png'
    )
  }

  async loadBlockedServers() {
    this.loading = true
    this.blockedServers = await this.utilsService.getBlockedServers()
    this.loaded = true
    this.loading = false
  }
}
