import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReportListComponent } from './report-list.component'
import { RouterModule } from '@angular/router'
import { MatCardModule } from '@angular/material/card'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatTableModule } from '@angular/material/table'
import { MatInputModule } from '@angular/material/input'
import { FormsModule } from '@angular/forms'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatButtonModule } from '@angular/material/button'
import { AvatarSmallComponent } from 'src/app/components/avatar-small/avatar-small.component'
import { PostLinkModule } from 'src/app/directives/post-link/post-link.module'

@NgModule({
  declarations: [ReportListComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ReportListComponent
      }
    ]),
    MatTableModule,
    FormsModule,
    MatCardModule,
    MatPaginatorModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    AvatarSmallComponent,
    PostLinkModule
  ]
})
export class ReportListModule { }
