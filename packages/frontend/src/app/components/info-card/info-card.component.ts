import { Component, computed, input } from '@angular/core'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { IconDefinition } from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'app-info-card',
  imports: [FontAwesomeModule],
  templateUrl: './info-card.component.html',
  styleUrl: './info-card.component.scss'
})
export class InfoCardComponent {
  type = input.required<IconDefinition>()
}
