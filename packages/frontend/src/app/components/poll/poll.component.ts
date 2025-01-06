import { Component, Input, OnInit } from '@angular/core'
import { FormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { QuestionPoll } from '../../interfaces/questionPoll'
import { LoginService } from '../../services/login.service'
import { PostsService } from '../../services/posts.service'

@Component({
  selector: 'app-poll',
  templateUrl: './poll.component.html',
  styleUrls: ['./poll.component.scss'],
  standalone: false
})
export class PollComponent implements OnInit {
  @Input() poll!: QuestionPoll
  total = 0
  openPoll = false
  form = new UntypedFormGroup({})
  userLoggedIn = false
  alreadyVoted = true

  constructor(
    private loginService: LoginService,
    private postsService: PostsService
  ) {
    this.userLoggedIn = loginService.checkUserLoggedIn()
  }

  ngOnInit(): void {
    this.openPoll = new Date().getTime() < this.poll.endDate.getTime()
    this.poll.questionPollQuestions.forEach((elem) => {
      this.total = this.total + elem.remoteReplies
    })
    this.alreadyVoted = this.poll?.questionPollQuestions.some((question) => question.questionPollAnswers.length > 0)
    if (this.poll?.questionPollQuestions && this.poll.questionPollQuestions.length > 0 && this.poll.multiChoice) {
      this.poll.questionPollQuestions.forEach((question) => {
        this.form.addControl(
          question.id.toString(),
          new FormControl(
            {
              value: question.questionPollAnswers.length > 0,
              disabled: this.alreadyVoted || !this.userLoggedIn || !this.openPoll
            },
            Validators.required
          )
        )
      })
    }
    if (!this.poll.multiChoice) {
      const existingReply = this.poll.questionPollQuestions.find((reply) => reply.questionPollAnswers.length > 0)
      this.form.addControl(
        'singleValue',
        new FormControl(
          {
            value: existingReply ? existingReply.id : '',
            disabled: this.alreadyVoted || !this.userLoggedIn || !this.openPoll
          },
          Validators.required
        )
      )
    }
  }

  async vote() {
    let votes: number[] = []
    const formValue = this.form.value
    if (this.poll.multiChoice) {
      Object.keys(formValue).forEach((key) => {
        if (formValue[key]) {
          votes.push(parseInt(key))
        }
      })
    } else {
      votes.push(parseInt(formValue.singleValue))
    }
    const voteSuccess = await this.postsService.voteInPoll(this.poll.id, votes)
    if (voteSuccess) {
      this.alreadyVoted = true
    }
  }
}
