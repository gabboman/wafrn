import { Component } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent {

  reportList: any[] = [];
  ready = false;
  constructor (
    private adminService: AdminService
  ) {
    this.loadReports();
  }

  loadReports() {
    this.ready = false;
    this.adminService.getReports().then((response: any) => {
      this.reportList = response.map((elem: any) => {
        elem.user.avatar = elem.user.url.startsWith('@') ? environment.externalCacheurl + encodeURIComponent(elem.user.avatar) : environment.baseMediaUrl + elem.user.avatar;
        elem.post.user.avatar = elem.post.user.url.startsWith('@') ? environment.externalCacheurl + encodeURIComponent(elem.post.user.avatar) : environment.baseMediaUrl + elem.post.user.avatar;

        elem.actions = [
          {
            label: 'Ignore',
            command: () => this.ignore(elem.id),
          },
          {
            label: 'Ban user',
            command: () => this.ban(elem.post.user.id)
          },
        ];
        return elem;
      });
      this.ready = true;
    })
  }

  ignore(id: number) {
    this.adminService.ignoreReport(id).then(() => {
      this.loadReports()
    })
  }

  ban(id: number) {
    this.adminService.banUser(id).then(() => {
      this.loadReports()
    })
  }

}
