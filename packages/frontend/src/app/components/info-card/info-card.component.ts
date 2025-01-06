import { NgClass } from '@angular/common'
import { Component, computed, input } from '@angular/core'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { faQuestionCircle, faTriangleExclamation, IconDefinition } from '@fortawesome/free-solid-svg-icons'

type InfoType = 'info' | 'caution'

const iconMap: Record<InfoType, IconDefinition> = {
  info: faQuestionCircle,
  caution: faTriangleExclamation
}

@Component({
  selector: 'app-info-card',
  imports: [FontAwesomeModule, NgClass],
  templateUrl: './info-card.component.html',
  styleUrl: './info-card.component.scss'
})
export class InfoCardComponent {
  type = input.required<InfoType>()
  icon = computed<IconDefinition>(() => iconMap[this.type()])
  addClass = input<string>('')
}
