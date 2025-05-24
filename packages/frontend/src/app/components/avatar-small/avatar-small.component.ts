import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { SimplifiedUser } from '../../interfaces/simplified-user'
import { EnvironmentService } from '../../services/environment.service'
import { BlogLinkModule } from 'src/app/directives/blog-link/blog-link.module'

@Component({
  selector: 'app-avatar-small',
  imports: [CommonModule, RouterModule, BlogLinkModule],
  templateUrl: './avatar-small.component.html',
  styleUrl: './avatar-small.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarSmallComponent {
  user = input.required<SimplifiedUser>()
  readonly disabled = input(false)
  avatar = computed(() => {
    const user = this.user()
    return (
      EnvironmentService.environment.externalCacheurl +
      encodeURIComponent(
        user.url.startsWith('@') ? user.avatar : EnvironmentService.environment.baseMediaUrl + user.avatar
      ) +
      '&avatar=true'
    )
  })
}
