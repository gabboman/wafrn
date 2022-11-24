import { Component, OnInit } from '@angular/core';
import { SimpleSeoService } from 'src/app/services/simple-seo.service';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss']
})
export class PrivacyComponent implements OnInit {

  constructor(
    private seo: SimpleSeoService
  ) {
    
  }

  ngOnInit(): void {
  }

}
