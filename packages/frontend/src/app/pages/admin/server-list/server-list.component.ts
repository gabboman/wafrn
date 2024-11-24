import { Component, OnInit, ViewChild } from '@angular/core';
import { server } from 'src/app/interfaces/servers';
import { AdminService } from 'src/app/services/admin.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
    selector: 'app-server-list',
    templateUrl: './server-list.component.html',
    styleUrls: ['./server-list.component.scss'],
    standalone: false
})
export class ServerListComponent implements OnInit {
  ready = false;
  originalServers: server[] = [];

  displayedColumns = ['displayName', 'blocked', 'friendServer', 'detail'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource!: MatTableDataSource<server, MatPaginator>;

  constructor(private adminService: AdminService) {
    this.adminService.getServers().then((response) => {
      this.originalServers = JSON.parse(JSON.stringify(response));
      this.ready = true;
      this.dataSource.data = response;
    });
  }
  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<server, MatPaginator>([]);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  async save() {
    // we detect where we have made changes the shotgun way
    const serversToPatch: server[] = [];
    this.dataSource.data.forEach((elem, index) => {
      const original = this.originalServers[index];
      if (
        elem.blocked != original.blocked ||
        elem.detail != original.detail ||
        elem.friendServer != original.friendServer
      ) {
        serversToPatch.push(elem);
      }
    });
    await this.adminService.updateServers(serversToPatch);
    this.originalServers = JSON.parse(JSON.stringify(this.dataSource.data));
  }
}
