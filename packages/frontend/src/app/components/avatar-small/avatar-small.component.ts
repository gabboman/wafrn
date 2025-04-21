import { CommonModule } from '@angular/common'
import { Component, OnInit, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { SimplifiedUser } from '../../interfaces/simplified-user'
import { EnvironmentService } from '../../services/environment.service'
import { BlogLinkModule } from 'src/app/directives/blog-link/blog-link.module'

@Component({
  selector: 'app-avatar-small',
  imports: [CommonModule, RouterModule, BlogLinkModule],
  templateUrl: './avatar-small.component.html',
  styleUrl: './avatar-small.component.scss'
})
export class AvatarSmallComponent implements OnInit {
  readonly user = input.required<SimplifiedUser>();
  readonly disabled = input(false);
  avatar: string = ''

  ngOnInit(): void {
    const user = this.user();
    this.avatar =
      EnvironmentService.environment.externalCacheurl +
      encodeURIComponent(
        user.url.startsWith('@')
          ? user.avatar
          : EnvironmentService.environment.baseMediaUrl + user.avatar
      ) +
      '&avatar=true'
  }
}
