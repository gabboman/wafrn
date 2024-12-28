import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MyServerBlocksComponent } from './my-server-blocks.component'
import { RouterModule } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { MatCardModule } from '@angular/material/card'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button'

@NgModule({
  declarations: [MyServerBlocksComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: MyServerBlocksComponent
      }
    ]),
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,
    MatButtonModule
  ]
})
export class MyServerBlocksModule {}
