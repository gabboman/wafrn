import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { DoomComponent } from 'src/app/pages/doom/doom.component'
const routes: Routes = [
  {
    path: '',
    component: DoomComponent,
    canActivate: []
  }
]

@NgModule({
  declarations: [DoomComponent],
  imports: [RouterModule.forChild(routes)]
})
export class DoomModule {}
