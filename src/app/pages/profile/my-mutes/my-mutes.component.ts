import { Component } from '@angular/core';
import { BlocksService } from 'src/app/services/blocks.service';

@Component({
  selector: 'app-my-mutes',
  templateUrl: './my-mutes.component.html',
  styleUrls: ['./my-mutes.component.scss']
})
export class MyMutesComponent {

  loading = true;
  mutedUsers: Array<any> = []

  constructor(
    private blocksService: BlocksService
  ) {
    this.blocksService.getMuteList().then(response => {
      this.mutedUsers = response;
      this.loading = false;
    });
  }

  async unmuteUser(id: string) {
    this.loading = true;
    this.mutedUsers = await this.blocksService.unmuteUser(id);
    this.loading = false;
  }

}
