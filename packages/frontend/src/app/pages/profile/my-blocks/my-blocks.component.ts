import { Component } from '@angular/core';
import { BlocksService } from 'src/app/services/blocks.service';


@Component({
  selector: 'app-my-blocks',
  templateUrl: './my-blocks.component.html',
  styleUrls: ['./my-blocks.component.scss'],
})
export class MyBlocksComponent {
  blocks: Array<any> = [];
  loading = true;
  displayedColumns = ['muted', 'actions'];

  constructor(private blocksService: BlocksService) {
    this.blocksService.getBlockList().then((response) => {
      this.blocks = response;
      this.loading = false;
    });
  }

  async unblockUser(id: string) {
    this.loading = true;
    this.blocks = await this.blocksService.unblockUser(id);
    this.loading = false;
  }
}
