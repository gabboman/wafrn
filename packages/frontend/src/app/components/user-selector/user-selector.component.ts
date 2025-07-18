import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { debounceTime, Subscription } from 'rxjs'
import { EditorService } from 'src/app/services/editor.service'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { SimplifiedUser } from 'src/app/interfaces/simplified-user'
import { AvatarSmallComponent } from '../avatar-small/avatar-small.component'

@Component({
  selector: 'app-user-selector',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    AvatarSmallComponent
  ],
  templateUrl: './user-selector.component.html',
  styleUrl: './user-selector.component.scss'
})
export class UserSelectorComponent implements OnDestroy {
  form = new FormGroup({
    userSearcher: new FormControl('')
  })

  @Input() controlText = ''
  @Input() fediExclusive = true
  @Output() optionSelected: EventEmitter<{ remoteId: string; url: string }> = new EventEmitter()
  subscriptions: Array<Subscription> = []
  userSearchSubscription: Subscription | null = null
  usersAutocompleteOptions: SimplifiedUser[] = []
  constructor(private editorService: EditorService) {
    this.subscriptions.push(
      this.form.controls['userSearcher'].valueChanges.pipe(debounceTime(300)).subscribe((changes) => {
        this.updateUserSearch()
      })
    )
  }

  updateUserSearch() {
    this.usersAutocompleteOptions = []
    if (this.userSearchSubscription) {
      this.userSearchSubscription.unsubscribe()
    }
    this.editorService.searchUser(this.form.controls['userSearcher'].value as string).then((result) => {
      // could (should) check the remoteid field, BUTT the type will get annoying so I rather do a quick and dirty thing.
      this.usersAutocompleteOptions = this.fediExclusive
        ? result.users.filter((usr) => usr.url.split('@').length == 3)
        : result.users
    })
  }

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe()
    }
    if (this.userSearchSubscription) {
      this.userSearchSubscription.unsubscribe()
    }
  }
}
