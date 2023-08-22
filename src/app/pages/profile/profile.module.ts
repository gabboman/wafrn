import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MyMutesComponent } from './my-mutes/my-mutes.component';
import { MyServerBlocksComponent } from './my-server-blocks/my-server-blocks.component';



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
        path: 'css',
        loadChildren: ()=>  import ('./css-editor/css-editor.module').then(m => m.CssEditorModule)
      },
      {
        path: 'blocks',
        loadChildren: () => import ('./my-blocks/my-blocks.module').then(m=> m.MyBlocksModule)
      },
      {
        path: 'serverBlocks',
        loadChildren: () => import('./my-server-blocks/my-server-blocks.module').then(m=>m.MyServerBlocksModule)
      },
      {
        path: 'mutes',
        loadChildren: () => import ('./my-mutes/my-mutes.module').then(m=> m.MyMutesModule)
      },
      {
        path: 'importFollowers',
        loadChildren: () => import ('./import-followers/import-followers.module').then(m=> m.ImportFollowersModule)
      }
    ])
  ]
})
export class ProfileModule { }
