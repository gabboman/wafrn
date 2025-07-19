import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { RouterModule } from '@angular/router'
import { LoaderComponent } from 'src/app/components/loader/loader.component'
import { DashboardService } from 'src/app/services/dashboard.service'
import { MessageService } from 'src/app/services/message.service'
import { PostsService } from 'src/app/services/posts.service'

@Component({
  selector: 'app-manage-followed-hashtags',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    RouterModule,
    MatButtonModule,
    LoaderComponent,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './manage-followed-hashtags.component.html',
  styleUrl: './manage-followed-hashtags.component.scss'
})
export class ManageFollowedHashtagsComponent {
  loading = true
  tag = ''
  constructor(
    public postsService: PostsService,
    private dashboardService: DashboardService,
    private messageService: MessageService
  ) {
    // we force update of the lists
    this.postsService.loadFollowers().then(() => {
      this.loading = false
    })
  }

  async updateHashtag(tag: string, follow: boolean) {
    this.loading = true
    if (follow) {
      this.tag = ''
    }
    const success = await this.dashboardService.manageHashtagSubscription(tag, follow)
    this.messageService.add({
      severity: success ? 'success' : 'error',
      summary: success ? `You no longer follow #${tag}` : 'Something went wrong!'
    })
    await this.postsService.loadFollowers()
    this.loading = false
  }
}
