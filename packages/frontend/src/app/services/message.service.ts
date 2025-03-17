import { Injectable } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import JSConfetti from 'js-confetti'

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  confetti: JSConfetti
  constructor(private snackBar: MatSnackBar) {
    this.confetti = new JSConfetti()
  }

  add(message: {
    severity: 'error' | 'success' | 'warn' | 'info'
    summary: string
    confettiEmojis?: string[]
    //detail?: string;
  }) {
    let icon = ''
    switch (message.severity) {
      case 'warn':
      case 'error':
        icon = '❌'
        break
      default:
        icon = '✅'
    }
    this.snackBar.open(message.summary, icon, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    })
    if (message.confettiEmojis) {
      this.confetti.addConfetti({
        emojis: message.confettiEmojis
      })
    }
  }
}
