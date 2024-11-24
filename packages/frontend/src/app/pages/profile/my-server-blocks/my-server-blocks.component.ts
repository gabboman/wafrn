import { Component } from '@angular/core';
import { BlocksService } from 'src/app/services/blocks.service';

@Component({
    selector: 'app-my-server-blocks',
    templateUrl: './my-server-blocks.component.html',
    styleUrls: ['./my-server-blocks.component.scss'],
    standalone: false
})
export class MyServerBlocksComponent {
  serverBlocks: any[] = [];
  ready = false;
  displayedColumns = ['muted', 'actions'];

  constructor(private blocksService: BlocksService) {
    this.blocksService.getMyServerBlockList().then((backendResponse) => {
      this.serverBlocks = backendResponse;
      this.ready = true;
    });
  }

  unblockServer(id: string) {
    this.ready = false;
    this.blocksService.unblockServer(id).then((response) => {
      this.serverBlocks = response;
      this.ready = true;
    });
  }
}
