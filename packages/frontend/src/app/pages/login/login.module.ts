import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LoginComponent } from './login.component'
import { RouterModule, Routes } from '@angular/router'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { userLoggedGuard } from 'src/app/guards/user-logged.guard'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [userLoggedGuard]
  }
]

@NgModule({
  declarations: [LoginComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FontAwesomeModule
  ]
})
export class LoginModule {}
