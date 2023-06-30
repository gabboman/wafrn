import { Component } from '@angular/core';
import { server } from 'src/app/interfaces/servers';
import { AdminService } from 'src/app/services/admin.service';

@Component({
  selector: 'app-server-list',
  templateUrl: './server-list.component.html',
  styleUrls: ['./server-list.component.scss']
})
export class ServerListComponent {
  ready = false;
  servers: server[] = []
  originalServers: server[] = []

  constructor(
    private adminService: AdminService
  ) {
    this.adminService.getServers().then((response)=> {
      this.servers = response;
      this.originalServers = JSON.parse(JSON.stringify(response));
      this.ready = true;
      console.log(this.servers)
    })
  }


  async save() {
    // we detect where we have made changes the shotgun way
    const serversToPatch: server[] = [];
    this.servers.forEach((elem, index) => {
      const original = this.originalServers[index]
      if(elem.blocked != original.blocked || elem.detail != original.detail) {
        serversToPatch.push(elem)
      }
    });
    await this.adminService.updateServers(serversToPatch);
    this.originalServers = JSON.parse(JSON.stringify(this.servers));


  }

}
