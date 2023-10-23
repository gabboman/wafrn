import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { QuestionPoll } from 'src/app/interfaces/questionPoll';

@Component({
  selector: 'app-poll',
  templateUrl: './poll.component.html',
  styleUrls: ['./poll.component.scss']
})
export class PollComponent  implements OnInit{

  @Input('poll') poll!: QuestionPoll;
  total = 0;

  ngOnInit(): void {
    this.poll.questionPollQuestions.forEach(elem => {
      this.total = this.total + elem.remoteReplies
    })
  }



}
