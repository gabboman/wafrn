import { Component, OnInit } from '@angular/core';
import { SimpleSeoService } from 'src/app/services/simple-seo.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss']
})
export class PrivacyComponent implements OnInit {
  logo = environment.logo;

  constructor(
    private seo: SimpleSeoService
  ) {

  }

  ngOnInit(): void {
  }

}
