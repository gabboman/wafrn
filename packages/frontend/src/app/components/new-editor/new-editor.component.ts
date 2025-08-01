import { CommonModule, Location } from '@angular/common'
import { Component, HostListener, inject, OnDestroy, ViewChild } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatChipsModule } from '@angular/material/chips'
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome'
import {
  faClose,
  faEnvelope,
  faExclamationTriangle,
  faGlobe,
  faLandMineOn,
  faQuestionCircle,
  faQuoteLeft,
  faServer,
  faSkullCrossbones,
  faUnlock,
  faUser,
  faPaperPlane,
  faAt
} from '@fortawesome/free-solid-svg-icons'
import { EditorData } from 'src/app/interfaces/editor-data'
import { PostHeaderComponent } from '../post/post-header/post-header.component'
import { PostFragmentComponent } from '../post-fragment/post-fragment.component'

import { QuestionPollQuestion } from 'src/app/interfaces/questionPoll'
import { SingleAskComponent } from '../single-ask/single-ask.component'
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu'
import { FileUploadComponent } from '../file-upload/file-upload.component'
import { WafrnMedia } from 'src/app/interfaces/wafrn-media'
import { MessageService } from 'src/app/services/message.service'
import { ProcessedPost } from 'src/app/interfaces/processed-post'
import { DashboardService } from 'src/app/services/dashboard.service'
import { MediaPreviewComponent } from '../media-preview/media-preview.component'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { EditorService } from 'src/app/services/editor.service'
import { LoginService } from 'src/app/services/login.service'
import { PostsService } from 'src/app/services/posts.service'
import { EmojiCollection } from 'src/app/interfaces/emoji-collection'
import { from, debounceTime, Subscription } from 'rxjs'
import { JwtService } from 'src/app/services/jwt.service'
import { AvatarSmallComponent } from '../avatar-small/avatar-small.component'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { EnvironmentService } from 'src/app/services/environment.service'
import { MatTooltipModule } from '@angular/material/tooltip'
import { InfoCardComponent } from '../info-card/info-card.component'
import { TranslateModule } from '@ngx-translate/core'
import { SimplifiedUser } from 'src/app/interfaces/simplified-user'
import { MatBadgeModule } from '@angular/material/badge'
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component'
import { Emoji } from 'src/app/interfaces/emoji'
import { Dialog } from '@angular/cdk/dialog'
import { Router } from '@angular/router'
import { MatProgressBarModule } from '@angular/material/progress-bar'
@Component({
  selector: 'app-new-editor',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FontAwesomeModule,
    PostHeaderComponent,
    PostFragmentComponent,
    SingleAskComponent,
    MatMenuModule,
    FileUploadComponent,
    MediaPreviewComponent,
    MatProgressSpinnerModule,
    AvatarSmallComponent,
    MatCheckboxModule,
    MatTooltipModule,
    InfoCardComponent,
    TranslateModule,
    MatBadgeModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  templateUrl: './new-editor.component.html',
  styleUrl: './new-editor.component.scss'
})
export class NewEditorComponent implements OnDestroy {
  privacyOptions = [
    { level: 0, name: 'Public', icon: faGlobe },
    { level: 3, name: 'Unlisted', icon: faUnlock },
    { level: 2, name: 'This instance only', icon: faServer },
    { level: 1, name: 'Followers only', icon: faUser },
    { level: 10, name: 'Direct Message', icon: faEnvelope }
  ]
  quoteOpen = false
  data: EditorData | undefined
  emojiDialog = inject(Dialog)
  editing = false
  baseMediaUrl = EnvironmentService.environment.baseMediaUrl
  cacheurl = EnvironmentService.environment.externalCacheurl
  userSelectionMentionValue = ''
  contentWarning = ''
  enablePrivacyEdition = true
  pollQuestions: QuestionPollQuestion[] = []
  disableImageUploadButton = false
  uploadedMedias: WafrnMedia[] = []
  emojiCollections: EmojiCollection[] = []
  @ViewChild('suggestionsMenu') suggestionsMenu!: MatMenuTrigger
  suggestions: { img: string; text: string }[] = []
  cursorPosition = {
    x: 0,
    y: 0
  }

  cursorTextPosition = 0

  showContentWarning = false
  displayMarqueeButton = false
  postCreatorForm = new FormGroup({
    content: new FormControl('')
  })
  initialContent = ''
  tags: string = ''
  privacy: number = 0
  urlPostToQuote: string = ''
  quoteLoading = false
  postBeingSubmitted = false

  closeIcon = faClose
  quoteIcon = faQuoteLeft
  contentWarningIcon = faExclamationTriangle
  landMineIcon = faLandMineOn
  skull = faSkullCrossbones
  infoIcon = faQuestionCircle
  alertIcon = faExclamationTriangle
  postIcon = faPaperPlane
  atIcon = faAt
  emojiSubscription: Subscription
  editorUpdatedSubscription: Subscription | undefined
  httpMentionPetitionSubscription: Subscription | undefined

  mentionedUsers: SimplifiedUser[] = []
  showMentionedUsersList = true

  parser = new DOMParser()

  constructor(
    private messages: MessageService,
    private dashboardService: DashboardService,
    private editorService: EditorService,
    private loginService: LoginService,
    public postService: PostsService,
    private jwtService: JwtService,
    private router: Router,
    private location: Location
  ) {
    this.data = EditorService.editorData
    this.editing = this.data?.edit == true
    this.privacy = this.loginService.getUserDefaultPostPrivacyLevel()
    if (this.data?.post) {
      this.contentWarning = this.data.post.content_warning ? this.data.post.content_warning : ''
      this.privacy = Math.max(this.data.post.privacy, this.privacy)
    }
    this.emojiSubscription = this.postService.updateFollowers.subscribe(() => {
      this.emojiCollections = this.postService.emojiCollections
    })
    let postCreatorContent = ''
    const currentUserId = this.jwtService.getTokenData().userId
    if (this.data?.post?.mentionPost && this.data.post.mentionPost.length > 0) {
      const mentionedUsersSet = new Set(this.data.post.mentionPost.filter((elem) => elem.id != currentUserId))
      this.mentionedUsers = Array.from(mentionedUsersSet)
    }
    if (this.data?.post) {
      if (
        this.data.post.user.id != currentUserId &&
        !this.mentionedUsers.map((elem) => elem.id).includes(this.data.post.user.url)
      ) {
        this.mentionedUsers.push(this.data.post.user)
      }
    }
    this.postCreatorForm.controls['content'].patchValue(postCreatorContent)

    if (this.editing && this.data?.post) {
      this.postCreatorForm.controls['content'].patchValue(this.data.post.markdownContent)
      this.contentWarning = this.data.post.content_warning
      this.tags = this.data.post.tags.map((tag) => tag.tagName).join(',')
      this.uploadedMedias = this.data.post.medias ? this.data.post.medias.filter((elem) => elem.mediaOrder < 9999) : []
      this.privacy = this.data.post.privacy
    }
  }

  @HostListener('window:scroll')
  updateMentionsPanelPosition() {
    if (this.editorUpdatedSubscription) {
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      const textarea = document.getElementById('postCreatorContent') as HTMLTextAreaElement
      const internalPosition = this.getCaretPosition(textarea)
      const rect = textarea.getBoundingClientRect()
      // 250 being the max width of the suggestions menu and 350 being the max height
      this.cursorPosition = {
        x: Math.min(internalPosition.x + rect.x, screenWidth - 275),
        y: Math.min(
          Math.max(48, internalPosition.y + rect.y),
          Math.max(screenHeight - 325, screenHeight - 64 * this.suggestions.length)
        )
      }
    }
  }

  updateMentionsSuggestions(cursorPosition: number) {
    this.httpMentionPetitionSubscription?.unsubscribe()
    this.suggestions = []
    const textToMatch = (' ' +
      this.postCreatorForm.value.content?.slice(cursorPosition - 250, cursorPosition).replaceAll('\n', ' ')) as string
    const matches = textToMatch.match(/[\n\r\s]?[@:][\w-\.]+@?[\w-\.]*$/)
    if (matches && matches.length > 0) {
      this.updateMentionsPanelPosition()
      const match = matches[0].trim()
      if (match.startsWith('@')) {
        this.httpMentionPetitionSubscription = from(
          this.editorService.searchUser(match.toLowerCase().slice(1))
        ).subscribe((res: any) => {
          this.suggestions = res.users.map((elem: any) => {
            return {
              img: elem.avatar,
              text: elem.url
            }
          })
          this.httpMentionPetitionSubscription?.unsubscribe()
        })
      } else {
        this.suggestions = this.emojiCollections
          .map((elem) => {
            const emojis = elem.emojis.filter(
              (emoji) => emoji.id == emoji.name && emoji.name.toLowerCase().includes(match.toLowerCase())
            )
            return emojis.map((emoji) => ({
              text: emoji.id,
              img: emoji.url
            }))
          })
          .flat()
          .slice(0, 25)
      }
    }
  }

  insertMention(user: { img: string; text: string }) {
    let initialPart = (' ' + this.postCreatorForm.value.content?.slice(0, this.cursorTextPosition)) as string
    const userUrl = user.text.startsWith(':') ? user.text : user.text.startsWith('@') ? user.text : '@' + user.text
    initialPart = initialPart.replace(/[[@:][A-Z0-9a-z_.@-]*$/i, userUrl)
    let finalPart = this.postCreatorForm.value.content?.slice(this.cursorTextPosition) as string
    this.postCreatorForm.controls['content'].patchValue(initialPart.trim() + ' ' + finalPart.trim())
    this.suggestions = []
  }

  ngOnDestroy(): void {
    this.emojiSubscription.unsubscribe()
    this.editorUpdatedSubscription?.unsubscribe()
    this.httpMentionPetitionSubscription?.unsubscribe()
  }

  get privacyOption() {
    return this.privacyOptions.find((elem) => elem.level === this.privacy)
  }

  getPrivacyIcon() {
    if (Number.isNaN(this.privacy)) {
      this.privacy = 0
    }
    const res = this.privacyOptions.find((elem) => elem.level === this.privacy)?.icon as IconDefinition
    return res
  }

  getPrivacyIconName() {
    return this.privacyOptions.find((elem) => elem.level === this.privacy)?.name
  }

  get idPostToReblog() {
    return this.data?.post?.id
  }

  async uploadImage(media: WafrnMedia) {
    try {
      media.url =
        EnvironmentService.environment.externalCacheurl +
        encodeURIComponent(EnvironmentService.environment.baseMediaUrl + media.url)
      this.uploadedMedias.push(media)
      this.messages.add({
        severity: 'success',
        summary: 'Media uploaded and added to the woot! Please fill in the description'
      })
    } catch (error) {
      console.error(error)
      this.messages.add({
        severity: 'error',
        summary: 'Oh no! something went wrong'
      })
    }
    this.disableImageUploadButton = false
  }

  async uploadCanceled() {
    this.messages.add({
      severity: 'info',
      summary: 'Upload canceled'
    })
  }

  async loadQuote() {
    const urlString = this.urlPostToQuote
    this.quoteLoading = true
    try {
      const url = new URL(urlString)
      let postToAdd: ProcessedPost | undefined
      if (url.host === new URL(EnvironmentService.environment.frontUrl).host) {
        // URL is a local one.  We need to check if it includes an UUID
        const UUIDRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gm
        const matches = urlString.match(UUIDRegex)
        if (matches) {
          const uuid = matches[0]
          const postFromBackend = await this.dashboardService.getPostV2(uuid)
          if (postFromBackend) {
            postToAdd = postFromBackend[postFromBackend.length - 1]
          }
        } else {
          this.messages.add({
            severity: 'error',
            summary: 'Sorry the url you pasted does not seem to be valid'
          })
        }
      } else {
        // url is external. we call the search function
        const searchResult = await this.dashboardService.getSearchPage(0, urlString)
        if (searchResult && searchResult.posts && searchResult.posts.length > 0) {
          postToAdd = searchResult.posts[0][searchResult.posts[0].length - 1]
        }
      }
      if (postToAdd) {
        if (postToAdd.privacy === 10 || postToAdd.privacy === 1 || postToAdd.privacy === 2) {
          this.messages.add({
            severity: 'error',
            summary: 'Sorry the post you selected is not quotable because of settings of the user'
          })
        } else {
          postToAdd.quotes = []
          if (this.data) {
            this.data.quote = postToAdd
          } else {
            this.data = {
              scrollDate: new Date(),
              path: '/',
              quote: postToAdd
            }
          }
        }
      } else {
        this.messages.add({
          severity: 'error',
          summary: 'Sorry we could not find the post you requested'
        })
      }
    } catch (error) {
      console.error(error)
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong when trying to load this.'
      })
    }
    this.quoteLoading = false
  }

  allDescriptionsFilled(): boolean {
    const disableCheck = localStorage.getItem('disableForceAltText') === 'true'
    return disableCheck || this.uploadedMedias.every((med) => med.description)
  }

  deleteImage(index: number) {
    // TODO we should look how to clean the disk at some point. A call to delete the media would be nice
    this.uploadedMedias.splice(index, 1)
  }

  @HostListener('keydown.control.enter')
  async submitPost() {
    if (
      !this.allDescriptionsFilled() ||
      this.postBeingSubmitted ||
      (this.postCreatorForm.value.content === this.initialContent &&
        this.tags.length === 0 &&
        this.uploadedMedias.length === 0)
    ) {
      this.messages.add({ severity: 'error', summary: 'Write a post or do something' })
      return
    }
    this.postBeingSubmitted = true
    let tagsToSend = ''
    this.tags
      .split(',')
      .map((elem) => elem.trim())
      .filter((t) => t !== '')
      .forEach((elem) => {
        tagsToSend = `${tagsToSend}${elem.trim()},`
      })
    tagsToSend = tagsToSend.slice(0, -1)
    let res = undefined
    const content = this.postCreatorForm.value.content ? this.postCreatorForm.value.content : ''
    // if a post includes only tags, we reblog it and then we also create the post with tags. Thanks shadowjonathan
    if (
      this.uploadedMedias.length === 0 &&
      content.length === 0 &&
      tagsToSend.length > 0 &&
      this.idPostToReblog &&
      !this.data?.quote?.id
    ) {
      await this.editorService.createPost({
        mentionedUsers: [],
        content: '',
        idPostToReblog: this.idPostToReblog,
        privacy: 0,
        media: []
      })
      // wait 500 milliseconds
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    const mentionsToBeSent = this.mentionedUsers.map((elem) => elem.id)
    res = await this.editorService.createPost({
      // deduplicate mentions too just in case
      mentionedUsers: Array.from(new Set(mentionsToBeSent)),
      content: content,
      media: this.uploadedMedias,
      privacy: this.privacy,
      tags: tagsToSend,
      idPostToReblog: this.editing ? undefined : this.idPostToReblog,
      contentWarning: this.contentWarning,
      idPostToEdit: this.editing ? this.idPostToReblog : undefined,
      idPosToQuote: this.data?.quote?.id,
      ask: this.data?.ask
    })
    // its a great time to check notifications isnt it?
    this.dashboardService.scrollEventEmitter.emit('post')
    if (res) {
      const disableConfetti = localStorage.getItem('disableConfetti') == 'true'
      this.messages.add({
        severity: 'success',
        summary: 'Your woot has been published!',
        confettiEmojis: disableConfetti ? [] : ['✏️', '🖍️', '✒️', '🖊️'],
        soundUrl: '/assets/sounds/2.ogg'
      })
      this.postCreatorForm.value.content = ''
      this.uploadedMedias = []
      this.tags = ''
      if (this.data?.ask) {
        // super dirty but we take you to your homepage after an ask
        this.router.navigate(['/'])
      } else {
        this.closeEditor()
      }
    }
    this.postBeingSubmitted = false
  }

  closeEditor() {
    this.location.back()
  }

  // things for calculating position
  // THANK YOU https://codepen.io/audinue/pen/EogPqQ

  createCopy(textArea: HTMLTextAreaElement) {
    var copy = document.createElement('div')
    copy.textContent = textArea.value
    var style = getComputedStyle(textArea)
    ;[
      'fontFamily',
      'fontSize',
      'fontWeight',
      'wordWrap',
      'whiteSpace',
      'borderLeftWidth',
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth'
    ].forEach(function (key: any) {
      copy.style[key] = style[key]
    })
    copy.style.overflow = 'auto'
    copy.style.width = textArea.offsetWidth + 'px'
    copy.style.height = textArea.offsetHeight + 'px'
    copy.style.position = 'absolute'
    copy.style.left = textArea.offsetLeft + 'px'
    copy.style.top = textArea.offsetTop + 'px'
    document.body.appendChild(copy)
    return copy
  }

  getCaretPosition(textArea: HTMLTextAreaElement) {
    let start = textArea.selectionStart
    let end = textArea.selectionEnd
    let copy = this.createCopy(textArea)
    let range = document.createRange()
    let firstChild = copy.firstChild
    let res = {
      x: 0,
      y: 0
    }
    if (firstChild) {
      range.setStart(firstChild, start)
      range.setEnd(firstChild, end)
      let selection = document.getSelection() as Selection
      selection.removeAllRanges()
      selection.addRange(range)
      var rect = range.getBoundingClientRect()
      document.body.removeChild(copy)
      textArea.selectionStart = start
      textArea.selectionEnd = end
      textArea.focus()
      res = {
        x: rect.left - textArea.scrollLeft,
        y: rect.top - textArea.scrollTop
      }
    }
    return res
  }

  editorFocusedOut() {
    this.editorUpdatedSubscription?.unsubscribe()
    this.httpMentionPetitionSubscription?.unsubscribe()
    this.editorUpdatedSubscription = undefined
    this.httpMentionPetitionSubscription = undefined
  }
  editorFocusedIn() {
    this.editorUpdatedSubscription = this.postCreatorForm.controls['content'].valueChanges
      .pipe(debounceTime(300))
      .subscribe((changes) => this.editorUpdateProcess())
  }

  editorUpdateProcess() {
    let postCreatorHTMLElement = document.getElementById('postCreatorContent') as HTMLTextAreaElement
    // we only call the event if user is writing to avoid TOOMFOLERY
    if (postCreatorHTMLElement.selectionStart === postCreatorHTMLElement.selectionEnd) {
      this.updateMentionsSuggestions(postCreatorHTMLElement.selectionStart)
      this.cursorTextPosition = postCreatorHTMLElement.selectionStart
    }
  }

  removeMention(index: number) {
    this.mentionedUsers.splice(index, 1)
  }

  openEmojiSelection(): void {
    const textarea = document.getElementById('postCreatorContent') as HTMLTextAreaElement
    const pos = textarea.selectionStart
    const dialogRef = this.emojiDialog.open<Emoji>(EmojiPickerComponent)

    dialogRef.closed.subscribe((result) => {
      if (result) {
        // we use the reactform for this
        this.postCreatorForm.controls['content'].patchValue(
          textarea.value.slice(0, pos) + result.name + textarea.value.slice(pos)
        )
      }
    })
  }

  calculateBskyPostLength() {
    // TODO do things in a better way
    const cwText = this.contentWarning.length > 0 ? `[${this.contentWarning}]\n` : ''
    const tagText =
      this.tags.length > 0
        ? `\n${this.tags
            .split(',')
            .map((elem) => '#' + elem)
            .join(' ')}`
        : ''
    const askText = this.data?.ask
      ? (this.data.ask.user ? this.data.ask.user.url : 'anonymous') + ' asked ' + this.data.ask.question + '\n'
      : ''
    const fediQuoteText = this.data?.quote && !this.data.quote.bskyUri ? '\nRE: ' + 'link20extracharacterssssss' : ''
    const inputText = `${askText}${cwText}${this.removeMarkdown(this.postCreatorForm.controls['content'].value as string)}${tagText}${fediQuoteText}`
    return inputText.length
  }

  calculateBskyPostLengthPercent() {
    return this.calculateBskyPostLength() / 300 // max characters
  }

  removeMarkdown(text: string) {
    return (
      text
        // Remove setext-style headers
        .replaceAll(/^[=\-]{2,}\s*$/g, '')
        // Remove footnotes?
        .replaceAll(/\[\^.+?\](\: .*?$)?/g, '')
        .replaceAll(/\s{0,2}\[.*?\]: .*?$/g, '')
        // Remove images
        .replaceAll(/\!\[(.*?)\][\[\(].*?[\]\)]/g, '')
        // Remove blockquotes
        .replaceAll(/^(\n)?\s{0,3}>\s?/gm, '$1')
        // Remove reference-style links?
        .replaceAll(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, '')
        // Remove atx-style headers
        .replaceAll(/^(\n)?\s{0,}#{1,6}\s*( (.+))? +#+$|^(\n)?\s{0,}#{1,6}\s*( (.+))?$/gm, '$1$3$4$6')
        // Remove code blocks
        .replaceAll(/(`{3,})(.*?)\1/gms, '$2')
        .replaceAll(/(`{3,})(md)(.*?)\1/gms, '$3')
        // Remove inline code
        .replaceAll(/`(.+?)`/gs, '$1')
    )
  }

  mediaIsVideo(media: WafrnMedia) {
    return media.url.endsWith('mp4') // technology
  }
}
