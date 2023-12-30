import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportFollowersComponent } from './import-followers.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    ImportFollowersComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ImportFollowersComponent
      }
    ])
  ]
})
export class ImportFollowersModule { }
