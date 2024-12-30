import { CommonModule } from '@angular/common'
import { Component, Inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, UntypedFormGroup, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { BlogDetails } from 'src/app/interfaces/blogDetails'
import { BlogService } from 'src/app/services/blog.service'
import { LoginService } from 'src/app/services/login.service'
import { MessageService } from 'src/app/services/message.service'
import { InfoCardComponent } from '../info-card/info-card.component'

@Component({
  selector: 'app-ask-dialog-content',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInput,
    MatFormFieldModule,
    MatButtonModule,
    InfoCardComponent
  ],
  templateUrl: './ask-dialog-content.component.html',
  styleUrl: './ask-dialog-content.component.scss'
})
export class AskDialogContentComponent {
  loggedIn: boolean

  constructor(
    private dialogRef: MatDialogRef<AskDialogContentComponent>,
    private messages: MessageService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      details: BlogDetails
    },
    private blogService: BlogService,
    private loginService: LoginService
  ) {
    this.loggedIn = loginService.checkUserLoggedIn()
  }

  askForm = new FormGroup({
    content: new FormControl('', [Validators.required, Validators.minLength(1)])
  })

  async onSubmit() {
    const res: any = await this.blogService.askuser(this.data.details.url, this.askForm.value.content as string)
    if (res.success) {
      this.messages.add({ severity: 'success', summary: 'You asked the user!' })
      this.dialogRef.close()
    } else {
      this.messages.add({ severity: 'error', summary: 'Something went wrong' })
    }
  }
}
