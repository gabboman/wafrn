import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-aac-for-alex',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './aac-for-alex.component.html',
  styleUrl: './aac-for-alex.component.scss'
})
export class AacForAlexComponent implements OnInit {

  text  = "loading"
  voice : SpeechSynthesisVoice | undefined
  ngOnInit(): void {
    const voices = speechSynthesis.getVoices().filter(elem => elem.lang == "nl-NL") ;
    if(voices.length > 0) {
      this.text = "Voice found"
      this.voice = voices[0];

    } else {
      this.text = "netherlands voice not found"
    }
  }

  sayStuff() {
    console.log('saystuff clicked')
    if(this.voice) {
      const message = new SpeechSynthesisUtterance("Hallo, ik ben Alexander en de koning is echt heet");
      message.voice = this.voice
      message.lang = "nl-NL"
      speechSynthesis.speak(message);
    }

  }

}
