import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { RouterModule } from '@angular/router'
import { LoaderComponent } from 'src/app/components/loader/loader.component'
import { DashboardService } from 'src/app/services/dashboard.service'
import { MessageService } from 'src/app/services/message.service'
import { PostsService } from 'src/app/services/posts.service'

@Component({
  selector: 'app-manage-followed-hashtags',
  imports: [CommonModule, MatCardModule, RouterModule, MatButtonModule, LoaderComponent],
  templateUrl: './manage-followed-hashtags.component.html',
  styleUrl: './manage-followed-hashtags.component.scss'
})
export class ManageFollowedHashtagsComponent {
  loading = true
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

  async unfollowHashtag(tag: string) {
    this.loading = true
    const success = await this.dashboardService.manageHashtagSubscription(tag, false)
    this.messageService.add({
      severity: success ? 'success' : 'error',
      summary: success ? `You no longer follow #${tag}` : 'Something went wrong!'
    })
    await this.postsService.loadFollowers()
    this.loading = false
  }
}
