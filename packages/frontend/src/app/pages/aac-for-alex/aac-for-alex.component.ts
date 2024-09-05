import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-aac-for-alex',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './aac-for-alex.component.html',
  styleUrl: './aac-for-alex.component.scss'
})
export class AacForAlexComponent implements OnInit {

  info  = "loading"
  textToSay = ""
  voices: SpeechSynthesisVoice[] = []
  languagesAllowed = ['en-GB', 'nl-NL', 'pl-PL', 'es-ES']
  selectedLangIndex = 1;
  voiceIndex = 0;
  constructor() {
    try {
      this.voices = speechSynthesis.getVoices().filter(elem => elem.localService && this.languagesAllowed.includes(elem.lang))
      if(this.voices.length > 0) {
        this.info = ""
        this.voiceIndex = this.voices.findIndex(elem => elem.lang == this.languagesAllowed[this.selectedLangIndex])
      } else {
        this.info = "Problem finding voices"
      }
    } catch(error) {
      this.info = "There was a problem accesing the TTS api on your browser. try another browser :("
    }
    
  }


  ngOnInit(): void {

  }

  async sayStuff() {
    await speechSynthesis.cancel()
      const message = new SpeechSynthesisUtterance(this.textToSay);
      message.voice = this.voices[this.voiceIndex]
      message.lang = this.languagesAllowed[this.selectedLangIndex]
      speechSynthesis.speak(message);

  }

}
