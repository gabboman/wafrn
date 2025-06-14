import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  audios: Map<string, HTMLAudioElement> = new Map()

  constructor() {
    // TODO maybe a better way to say "hey preload these audios"
    const audiosToPreload = [
      '/assets/sounds/1.ogg',
      '/assets/sounds/2.ogg',
      '/assets/sounds/3.ogg',
      '/assets/sounds/4.ogg',
      '/assets/sounds/5.ogg'
    ]

    audiosToPreload.forEach((elem) => {
      const audio = new Audio(elem)
      audio.preload = 'auto'
      this.audios.set(elem, audio)
    })
  }

  playSound(name: string, volume = 0.3) {
    try {
      let audio = this.audios.get(name)
      if (!audio) {
        audio = new Audio(name)
        this.audios.set(name, audio)
      }
      audio.volume = volume
      audio.play()
    } catch (error) {
      console.error(error)
    }
  }
}
