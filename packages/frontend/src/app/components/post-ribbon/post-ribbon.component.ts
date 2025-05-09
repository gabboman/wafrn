import { Component, input, OnInit, SimpleChanges } from '@angular/core'
import { SimplifiedUser } from 'src/app/interfaces/simplified-user'
import { AvatarSmallComponent } from '../avatar-small/avatar-small.component'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { MatCardModule } from '@angular/material/card'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { NgClass, NgTemplateOutlet } from '@angular/common'
import { DateTime } from 'luxon'

@Component({
  selector: 'app-post-ribbon',
  imports: [MatCardModule, AvatarSmallComponent, FontAwesomeModule, NgTemplateOutlet, NgClass],
  templateUrl: './post-ribbon.component.html',
  styleUrl: './post-ribbon.component.scss'
})
export class PostRibbonComponent implements OnInit {
  readonly user = input.required<SimplifiedUser>();
  readonly icon = input.required<IconDefinition>();
  readonly time = input.required<Date>();
  readonly card = input(true);

  timeAgo = ''

  ngOnInit(): void {
    // TODO unhardcode
    const relative = DateTime.fromJSDate(this.time()).setLocale('en').toRelative()
    this.timeAgo = relative ? relative : 'ERROR GETING TIME'
  }

  ngOnChanges(changes: SimpleChanges): void { }
}
