import { Component, OnInit } from '@angular/core';
import { EnvironmentService } from 'src/app/services/environment.service';
import { SimpleSeoService } from 'src/app/services/simple-seo.service';


@Component({
    selector: 'app-privacy',
    templateUrl: './privacy.component.html',
    styleUrls: ['./privacy.component.scss'],
    standalone: false
})
export class PrivacyComponent implements OnInit {
  logo = EnvironmentService.environment.logo;

  constructor(
    private seo: SimpleSeoService
  ) {

  }

  ngOnInit(): void {
    this.seo.setSEOTags('Wafrn Privacy Policy', 'The wafrn privacy policy', 'The wafrn team', '/assets/linkpreview.png')
  }

}
