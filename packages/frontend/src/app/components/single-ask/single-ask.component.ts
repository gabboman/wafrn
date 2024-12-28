import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { AvatarSmallComponent } from '../avatar-small/avatar-small.component'
import { Ask } from '../../interfaces/ask'

@Component({
  selector: 'app-single-ask',
  imports: [CommonModule, AvatarSmallComponent],
  templateUrl: './single-ask.component.html',
  styleUrl: './single-ask.component.scss'
})
export class SingleAskComponent {
  @Input() ask!: Ask
}
