import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DeletePostService } from 'src/app/services/delete-post.service';
import { MessageService } from 'src/app/services/message.service';
import {
  MatDialogContent,
  MatDialogTitle,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { LoaderComponent } from "../loader/loader.component";
@Component({
  selector: 'app-delete-post',
  templateUrl: './delete-post.component.html',
  styleUrls: ['./delete-post.component.scss'],
  imports: [
    MatButtonModule,
    MatDialogTitle,
    LoaderComponent
  ]
})
export class DeletePostComponent {
  postToDelete: string;
  deleting = false;

  constructor(
    private deletePostService: DeletePostService,
    private messages: MessageService,
    private dialogRef: MatDialogRef<DeletePostComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string }
  ) {
    this.postToDelete = data.id;
  }

  cancelDelete() {
    this.dialogRef.close();
  }

  deletePost() {
    this.deleting = true;
    if (this.postToDelete) {
      const subscription = this.deletePostService
        .deletePost(this.postToDelete)
        .subscribe(
          (res) => {
            subscription.unsubscribe();
            if (res) {
              if (res) {
                this.messages.add({
                  severity: 'success',
                  summary:
                    'The post has been deleted and now the page will be reloaded',
                });
                this.dialogRef.close();
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              } else {
                this.messages.add({
                  severity: 'error',
                  summary:
                    'There was an error deleting the post. Please, try again and let us know about the issue',
                });
                this.dialogRef.close();
              }
            }
          },
          (err) => {
            console.error(err);
            this.messages.add({
              severity: 'error',
              summary:
                'There was an error deleting the post. Please, try again and let us know about the issue',
            });
            this.dialogRef.close();
          }
        );
    }
    this.deleting = false;
  }
}
