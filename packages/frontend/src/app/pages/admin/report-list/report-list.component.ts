import { Component, OnInit, ViewChild } from '@angular/core'
import { MatPaginator } from '@angular/material/paginator'
import { MatTableDataSource } from '@angular/material/table'
import { AdminService } from 'src/app/services/admin.service'

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss'],
  standalone: false
})
export class ReportListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator
  dataSource!: MatTableDataSource<any, MatPaginator>
  displayedColumns = ['user', 'reportedUser', 'report', 'solved', 'actions']

  ready = false
  constructor(private adminService: AdminService) {
    this.loadReports()
  }
  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<any, MatPaginator>([])
    setTimeout(() => {
      this.dataSource.paginator = this.paginator
    })
  }

  loadReports() {
    this.ready = false
    this.adminService.getReports().then((response: any) => {
      this.dataSource.data = response.map((elem: any) => {
        return elem
      })
      console.log(this.dataSource.data)
      this.ready = true
    })
  }

  ignore(id: number) {
    this.adminService.ignoreReport(id).then(() => {
      this.loadReports()
    })
  }

  ban(id: string) {
    this.adminService.banUser(id).then(() => {
      this.loadReports()
    })
  }
}
