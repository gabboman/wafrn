import { DialogModule } from '@angular/cdk/dialog';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-accept-theme',
  standalone: true,
  imports: [DialogModule],
  templateUrl: './accept-theme.component.html',
  styleUrl: './accept-theme.component.scss',
})
export class AcceptThemeComponent {
  constructor(
    private themeService: ThemeService,
    private dialogService: MatDialogRef<AcceptThemeComponent>
  ) {}

  answerCustomThemeModal(response: number) {
    localStorage.setItem('acceptsCustomThemes', response.toString());
    this.dialogService.close();
  }
}
