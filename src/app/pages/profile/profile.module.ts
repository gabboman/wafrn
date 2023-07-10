import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MyMutesComponent } from './my-mutes/my-mutes.component';



@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: 'edit',
        loadChildren: ()=>  import ('./edit-profile/edit-profile.module').then(m => m.EditProfileModule)
      },
      {
        path: 'blocks',
        loadChildren: () => import ('./my-blocks/my-blocks.module').then(m=> m.MyBlocksModule)
      },
      {
        path: 'mutes',
        loadChildren: () => import ('./my-mutes/my-mutes.module').then(m=> m.MyMutesModule)
      }
    ])
  ]
})
export class ProfileModule { }
