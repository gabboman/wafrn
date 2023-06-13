import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DeletePostService } from 'src/app/services/delete-post.service';

@Component({
  selector: 'app-delete-post',
  templateUrl: './delete-post.component.html',
  styleUrls: ['./delete-post.component.scss']
})
export class DeletePostComponent implements OnInit {


  postToDelete: string | undefined = undefined;
  visible = false;

  constructor(
    private deletePostService: DeletePostService,
    private messages: MessageService
  ) {
    this.deletePostService.launchDeleteScreen.subscribe((id) => {
      this.postToDelete = id;
      this.visible = true;
    })
  }

  ngOnInit(): void {
  }

  cancelDelete() {
    this.postToDelete = undefined;
    this.visible = false;
  }

  deletePost() {
    if(this.postToDelete){
      const subscription = this.deletePostService.deletePost(this.postToDelete).subscribe((res) => {
        subscription.unsubscribe();
        if(res){
          if(res){
            this.messages.add({ severity: 'success', summary: 'The post has been deleted and now the page will be reloaded' });
            setTimeout(()=> {
              window.location.reload()
            }, 1000);
          }else{
            this.messages.add({ severity: 'error', summary: 'There was an error deleting the post. Please, try again and let us know about the issue' });
            this.visible = false;
          }

        }
      }, (err) => {
        console.error(err);
        this.messages.add({ severity: 'error', summary: 'There was an error deleting the post. Please, try again and let us know about the issue' });
        this.visible = false;
      });
    }
  }

}
