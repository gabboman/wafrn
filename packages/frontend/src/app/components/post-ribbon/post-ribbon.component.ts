import { Component, input } from '@angular/core'
import { SimplifiedUser } from 'src/app/interfaces/simplified-user'
import { AvatarSmallComponent } from '../avatar-small/avatar-small.component'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { MatCardModule } from '@angular/material/card'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { NgClass, NgTemplateOutlet } from '@angular/common'

@Component({
  selector: 'app-post-ribbon',
  imports: [MatCardModule, AvatarSmallComponent, FontAwesomeModule, NgTemplateOutlet, NgClass],
  templateUrl: './post-ribbon.component.html',
  styleUrl: './post-ribbon.component.scss'
})
export class PostRibbonComponent {
  user = input.required<SimplifiedUser>()
  icon = input.required<IconDefinition>()
  card = input(true)
}
