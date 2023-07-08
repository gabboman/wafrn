import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';



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
      }
    ])
  ]
})
export class ProfileModule { }
