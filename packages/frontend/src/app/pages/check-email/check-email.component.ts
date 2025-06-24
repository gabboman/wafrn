import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-check-email',
  imports: [
    CommonModule,
    MatCardModule,
    RouterModule,
    FontAwesomeModule,
    TranslateModule
  ],
  templateUrl: './check-email.component.html',
  styleUrl: './check-email.component.scss'
})
export class CheckEmailComponent {

  mailIcon = faEnvelope
}
