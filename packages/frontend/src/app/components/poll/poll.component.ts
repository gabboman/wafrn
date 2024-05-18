import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { QuestionPoll } from 'src/app/interfaces/questionPoll';

@Component({
  selector: 'app-poll',
  templateUrl: './poll.component.html',
  styleUrls: ['./poll.component.scss']
})
export class PollComponent  implements OnInit{

  @Input() poll!: QuestionPoll;
  total = 0;
  openPoll = false;
  form = new UntypedFormGroup({
    singleValue: new FormControl('', Validators.required)
  })

  ngOnInit(): void {
    this.openPoll = new Date().getTime() < this.poll.endDate.getTime()
    this.poll.questionPollQuestions.forEach(elem => {
      this.total = this.total + elem.remoteReplies
    })
    if(this.openPoll && this.poll?.questionPollQuestions && this.poll.questionPollQuestions.length > 0 && this.poll.multiChoice) {
      this.poll.questionPollQuestions.forEach(question => {
        this.form.addControl(question.id.toString(), new FormControl(''))
      })
    }
  }



  vote() {
    console.log(this.form.value)
    
  }

  isFormValid(): boolean {
    return Object.keys(this.form.value).some((key: string) => this.form.value[key])
  }


}
