import { Component } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-blocks',
  templateUrl: './blocks.component.html',
  styleUrls: ['./blocks.component.scss']
})
export class BlocksComponent {

  userBlocks: any[] = [];
  serverBlocks: any[] = [];
  ready = false;
  constructor(
    private adminService: AdminService
  ) {
    adminService.getBlocks().then((response) => {
      this.userBlocks = response.userBlocks.map((elem: any) => {
        elem.blocker.avatar = elem.blocker.url.startsWith('@') ? `${environment.externalCacheurl}${encodeURIComponent(elem.blocker.avatar)}` : environment.baseMediaUrl + elem.blocker.avatar;
        elem.blocked.avatar = elem.blocked.url.startsWith('@') ? `${environment.externalCacheurl}${encodeURIComponent(elem.blocked.avatar)}` : environment.baseMediaUrl + elem.blocked.avatar;
        return elem;
      } );
      this.serverBlocks = response.userServerBlocks.map((elem: any) => {
        elem.userBlocker.avatar = elem.userBlocker.url.startsWith('@')? `${environment.externalCacheurl}${encodeURIComponent(elem.userBlocker.avatar)}` : environment.baseMediaUrl + elem.userBlocker.avatar
        return elem;
      });
      this.ready = true;
    })
  }

}
