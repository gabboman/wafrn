import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AdminService } from 'src/app/services/admin.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss'],
})
export class ReportListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource!: MatTableDataSource<any, MatPaginator>;
  displayedColumns = ['user', 'reportedUser', 'report', 'solved', 'actions'];

  ready = false;
  constructor(private adminService: AdminService) {
    this.loadReports();
  }
  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<any, MatPaginator>([]);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  loadReports() {
    this.ready = false;
    this.adminService.getReports().then((response: any) => {
      this.dataSource.data = response.map((elem: any) => {
        elem.user.avatar = elem.user?.url.startsWith('@')
          ? environment.externalCacheurl + encodeURIComponent(elem.user.avatar)
          : environment.baseMediaUrl + elem.user?.avatar;
        elem.post.user.avatar = elem.post.user?.url.startsWith('@')
          ? environment.externalCacheurl +
            encodeURIComponent(elem.post.user?.avatar)
          : environment.baseMediaUrl + elem.post.user?.avatar;
        return elem;
      });
      this.ready = true;
    });
  }

  ignore(id: number) {
    this.adminService.ignoreReport(id).then(() => {
      this.loadReports();
    });
  }

  ban(id: string) {
    this.adminService.banUser(id).then(() => {
      this.loadReports();
    });
  }
}
