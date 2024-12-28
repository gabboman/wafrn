import { Component, OnDestroy, OnInit } from '@angular/core'
import { Title } from '@angular/platform-browser'

@Component({
  selector: 'app-doom',
  templateUrl: './doom.component.html',
  styleUrls: ['./doom.component.scss'],
  standalone: false
})
export class DoomComponent implements OnInit {
  constructor(private titleService: Title) {
    this.titleService.setTitle('Wafrn - the social network with DOOM!')
  }

  ngOnInit(): void {}
}
