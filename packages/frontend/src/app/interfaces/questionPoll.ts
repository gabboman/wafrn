export interface QuestionPoll {
  id: number
  endDate: Date
  multiChoice: boolean
  createdAt: string
  updatedAt: string
  postId: string
  questionPollQuestions: QuestionPollQuestion[]
}

export interface QuestionPollQuestion {
  id: number
  questionText: string
  index: number
  remoteReplies: number
  createdAt: string
  updatedAt: string
  questionPollId: number
  questionPollAnswers: string[]
}
