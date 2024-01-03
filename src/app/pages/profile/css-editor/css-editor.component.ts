import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'src/app/services/message.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-css-editor',
  templateUrl: './css-editor.component.html',
  styleUrls: ['./css-editor.component.scss'],
})
export class CssEditorComponent {
  ready = false;
  myCSS = '';
  modules = {
    // some day we will get it
    syntax: false,
    toolbar: [],
  };
  constructor(
    private themeService: ThemeService,
    private messages: MessageService,
    private router: Router
  ) {
    this.themeService
      .getMyThemeAsSting()
      .then((theme) => {
        this.myCSS = theme;
        this.ready = true;
      })
      .catch((error) => {
        console.warn(error);
        this.ready = true;
      });
  }

  submit() {
    this.ready = false;
    this.themeService
      .updateTheme(this.myCSS)
      .then(() => {
        this.ready = true;
        this.messages.add({
          severity: 'success',
          summary: 'Success!',
        });
        this.router.navigate(['/dashboard']);
      })
      .catch((error: any) => {
        console.log(error);
        this.ready = true;
        this.messages.add({
          severity: 'error',
          summary: 'Something went wrong',
        });
      });
  }
}
