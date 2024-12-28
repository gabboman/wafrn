import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ImportFollowersComponent } from './import-followers.component'
import { RouterModule } from '@angular/router'
import { MatCardModule } from '@angular/material/card'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatButtonModule } from '@angular/material/button'
import { MatProgressBarModule } from '@angular/material/progress-bar'
@NgModule({
  declarations: [ImportFollowersComponent],
  imports: [
    CommonModule,
    MatCardModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatProgressBarModule,
    RouterModule.forChild([
      {
        path: '',
        component: ImportFollowersComponent
      }
    ])
  ]
})
export class ImportFollowersModule {}
