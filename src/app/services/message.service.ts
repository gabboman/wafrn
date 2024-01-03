import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor(private snackBar: MatSnackBar) {}

  add(message: {
    severity: 'error' | 'success' | 'warn' | 'info';
    summary: string;
    //detail?: string;
  }) {
    let icon = '';
    switch (message.severity) {
      case 'warn':
      case 'error':
        icon = '❌';
        break;
      default:
        icon = '✅';
    }
    this.snackBar.open(message.summary, icon, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
