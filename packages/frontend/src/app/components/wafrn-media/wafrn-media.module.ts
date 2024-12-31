import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { WafrnMediaComponent } from './wafrn-media.component'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'

@NgModule({
  declarations: [WafrnMediaComponent],
  imports: [CommonModule, MatCardModule, MatButtonModule, FontAwesomeModule],
  exports: [WafrnMediaComponent]
})
export class WafrnMediaModule {}
