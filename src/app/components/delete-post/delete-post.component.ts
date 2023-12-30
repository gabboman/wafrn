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
@Component({
  selector: 'app-delete-post',
  templateUrl: './delete-post.component.html',
  styleUrls: ['./delete-post.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    MatDialogClose,
  ],
})
export class DeletePostComponent {
  postToDelete: string;

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
  }
}
