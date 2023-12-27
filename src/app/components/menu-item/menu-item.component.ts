import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MenuItem } from 'src/app/interfaces/menu-item';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import {MatBadgeModule} from '@angular/material/badge';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    MatButtonModule,
    MatListModule,
    MatBadgeModule
  ],
  templateUrl: './menu-item.component.html',
  styleUrl: './menu-item.component.scss'
})
export class MenuItemComponent {

  chevronUp = faChevronUp;
  chevronDown = faChevronDown;

  @Input() item!: MenuItem;
  expanded = false;


  doCommand() {
    // TODO href and routerlink in the same page, a way of not doing it this dirty way
    // this is BAD for accesibility you know
    // the other option was an ngif and displaying it depending on this. not cool!
    if(this.item.url) {
      window.open(this.item.url, '_blank');
    }
    if(this.item.command) {
      this.item.command();
    }
  }

}
