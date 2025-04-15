import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PrivacyComponent } from './privacy.component'
import { Route, RouterModule } from '@angular/router'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { LoaderComponent } from 'src/app/components/loader/loader.component'

const routes: Route[] = [
  {
    path: '',
    component: PrivacyComponent
  }
]

@NgModule({
  declarations: [PrivacyComponent],
  imports: [CommonModule, RouterModule.forChild(routes), MatCardModule, MatButtonModule, LoaderComponent]
})
export class PrivacyModule {}
