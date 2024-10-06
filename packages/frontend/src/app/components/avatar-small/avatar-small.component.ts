import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SimplifiedUser } from 'src/app/interfaces/simplified-user';
import { EnvironmentService } from 'src/app/services/environment.service';


@Component({
  selector: 'app-avatar-small',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './avatar-small.component.html',
  styleUrl: './avatar-small.component.scss'
})
export class AvatarSmallComponent implements OnInit {
  @Input() user!: SimplifiedUser;
  @Input() disabled = false;
  avatar: string = ''


  ngOnInit(): void {
    this.avatar = EnvironmentService.environment.externalCacheurl + encodeURIComponent(
      this.user.url.startsWith('@') ?
        this.user.avatar :
        EnvironmentService.environment.baseMediaUrl + this.user.avatar
    ) + '&avatar=true'
  }



}
