import { Injectable } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import JSConfetti from 'js-confetti'
import { AudioService } from './audio.service'

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  confetti: JSConfetti
  constructor(
    private snackBar: MatSnackBar,
    private audioService: AudioService
  ) {
    this.confetti = new JSConfetti()
  }

  add(message: {
    severity: 'error' | 'success' | 'warn' | 'info'
    summary: string
    confettiEmojis?: string[]
    soundUrl?: string
  }) {
    if (localStorage.getItem('disableSounds') != 'true' && message.soundUrl) {
      this.audioService.playSound(message.soundUrl)
    }
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
    if (message.confettiEmojis && message.confettiEmojis.length) {
      this.confetti.addConfetti({
        emojis: message.confettiEmojis
      })
    }
  }
}
