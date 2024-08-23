import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { BlogDetails } from 'src/app/interfaces/blogDetails';
import { BlogService } from 'src/app/services/blog.service';

@Component({
  selector: 'app-ask-dialog-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInput,
    MatFormFieldModule,
    MatButtonModule
  ],
  templateUrl: './ask-dialog-content.component.html',
  styleUrl: './ask-dialog-content.component.scss'
})
export class AskDialogContentComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      details: BlogDetails
    },
    private blogService: BlogService

  ) { }

  askForm = new FormGroup({
    content: new FormControl('', Validators.required)
  })


  async onSubmit() {
    await this.blogService.askuser(this.data.details.url, this.askForm.value.content as string)
  }

}
