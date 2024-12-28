import { RecoverPasswordComponent } from './recover-password.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatCardModule } from '@angular/material/card'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'

const routes: Routes = [
  {
    path: '',
    component: RecoverPasswordComponent
  }
]

@NgModule({
  declarations: [RecoverPasswordComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FontAwesomeModule,
    RouterModule.forChild(routes)
  ],
  exports: []
})
export class RecoverPasswordModule {}
