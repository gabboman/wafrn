import { Component, Input, input, SimpleChanges } from '@angular/core'
import { SimplifiedUser } from 'src/app/interfaces/simplified-user'
import { AvatarSmallComponent } from '../avatar-small/avatar-small.component'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { MatCardModule } from '@angular/material/card'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common'
import { MatTooltipModule } from '@angular/material/tooltip'
import { DateTimeFromJsDatePipe, DateTimeToRelativePipe } from 'luxon-angular'

@Component({
  selector: 'app-post-ribbon',
  imports: [
    MatCardModule,
    AvatarSmallComponent,
    FontAwesomeModule,
    NgTemplateOutlet,
    NgClass,
    DatePipe,
    MatTooltipModule
  ],
  providers: [DateTimeToRelativePipe, DateTimeFromJsDatePipe],
  templateUrl: './post-ribbon.component.html',
  styleUrl: './post-ribbon.component.scss'
})
export class PostRibbonComponent {
  @Input({ required: true }) user!: SimplifiedUser
  @Input({ required: true }) icon!: IconDefinition
  @Input({ required: true }) time!: Date
  @Input() card = true

  timeAgo = ''

  constructor(
    private readonly dateTimeToRelative: DateTimeToRelativePipe,
    private readonly dateTimeFromJsDatePipe: DateTimeFromJsDatePipe
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.timeAgo = this.dateTimeToRelative.transform(
      this.dateTimeFromJsDatePipe.transform(this.time),
      // TODO unhardcode locale
      { style: 'long', locale: 'en' }
    )
  }
}
