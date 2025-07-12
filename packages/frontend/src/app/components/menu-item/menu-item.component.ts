import { Component, Input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatListModule } from '@angular/material/list'
import { Router, RouterModule } from '@angular/router'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { MenuItem } from 'src/app/interfaces/menu-item'
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { MatBadgeModule } from '@angular/material/badge'
import { MatMenuModule } from '@angular/material/menu'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-menu-item',
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    MatButtonModule,
    MatListModule,
    MatBadgeModule,
    MatMenuModule
  ],
  templateUrl: './menu-item.component.html',
  styleUrl: './menu-item.component.scss'
})
export class MenuItemComponent {
  chevronUp = faChevronUp
  chevronDown = faChevronDown

  @Input() item!: MenuItem
  @Input() button = false
  expanded = false

  constructor(private router: Router) {}

  doCommand() {
    console.log('command called')
    if (this.item.items && this.item.items.length > 0) {
      this.expanded = !this.expanded
    } else {
      if (this.item.url) {
        window.open(this.item.url, '_blank')
      }
      if (this.item.command) {
        this.item.command()
      }
    }
  }

  handleKey(event: KeyboardEvent) {
    if (event.key !== 'Enter') return

    // Run the associated event
    if (this.item.items) {
      this.expanded = !this.expanded
    } else {
      this.doCommand()
    }
  }
}
