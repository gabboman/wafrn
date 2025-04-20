import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { EditProfileComponent } from './edit-profile.component'
import { RouterModule, Routes } from '@angular/router'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { loginRequiredGuard } from 'src/app/guards/login-required.guard'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { EmojiCollectionsComponent } from 'src/app/components/emoji-collections/emoji-collections.component'
import { MatExpansionModule } from '@angular/material/expansion'
import { TranslateModule } from '@ngx-translate/core'

const routes: Routes = [
  {
    path: '',
    component: EditProfileComponent,
    canActivate: [loginRequiredGuard]
  }
]

@NgModule({
  declarations: [EditProfileComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    EmojiCollectionsComponent,
    MatExpansionModule,
    TranslateModule
  ]
})
export class EditProfileModule { }
