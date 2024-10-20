import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { BlogDetails } from 'src/app/interfaces/blogDetails';
import { Emoji } from 'src/app/interfaces/emoji';
import { DashboardService } from 'src/app/services/dashboard.service';
import { JwtService } from 'src/app/services/jwt.service';
import { LoginService } from 'src/app/services/login.service';
import { MediaService } from 'src/app/services/media.service';
import { MessageService } from 'src/app/services/message.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit {
  loading = true;
  img: File | undefined = undefined;
  privacyOptions = [
    { level: 0, name: 'Public' },
    { level: 1, name: 'Followers only' },
    { level: 2, name: 'This instance only' },
    { level: 3, name: 'Unlisted' },
  ];
  askOptions = [
    { level: 1, name: 'Allow anon asks' },
    { level: 2, name: 'Only allow asks from identified users' },
    { level: 3, name: 'Disable asks' },
  ];
  editProfileForm = new UntypedFormGroup({
    avatar: new UntypedFormControl('', []),
    name: new FormControl('', Validators.required),
    disableNSFWFilter: new UntypedFormControl(false, []),
    disableGifsByDefault: new UntypedFormControl(false, []),
    defaultPostEditorPrivacy: new UntypedFormControl(false, []),
    asksLevel: new UntypedFormControl(2, []),
    description: new FormControl('', Validators.required),
    federateWithThreads: new FormControl(false),
    disableForceAltText: new FormControl(false),
    forceClassicLogo: new FormControl(false),
    manuallyAcceptsFollows: new FormControl(false),
    forceOldEditor: new FormControl(false),
    mutedWords: new FormControl('')
  });

  constructor(
    private jwtService: JwtService,
    private dashboardService: DashboardService,
    private mediaService: MediaService,
    private loginService: LoginService,
    private messages: MessageService,
    private themeService: ThemeService
  ) {
    this.themeService.setTheme('');
  }

  ngOnInit(): void {
    this.dashboardService
      .getBlogDetails(this.jwtService.getTokenData()['url'], true)
      .then(async (blogDetails) => {
        blogDetails['avatar'] = '';
        this.editProfileForm.patchValue(blogDetails);
        this.editProfileForm.controls['disableNSFWFilter'].patchValue(
          this.mediaService.checkNSFWFilterDisabled
        );
        this.editProfileForm.controls['defaultPostEditorPrivacy'].patchValue(
          this.loginService.getUserDefaultPostPrivacyLevel()
        );
        this.editProfileForm.controls['forceClassicLogo'].patchValue(
          this.loginService.getForceClassicLogo()
        );
        const federateWithThreads = localStorage.getItem('federateWithThreads');
        this.editProfileForm.controls['federateWithThreads'].patchValue(
          federateWithThreads === 'true'
        );
        const disableForceAltText = localStorage.getItem('disableForceAltText');
        this.editProfileForm.controls['disableForceAltText'].patchValue(
          disableForceAltText === 'true'
        );
        const forceOldEditor = localStorage.getItem('forceOldEditor') === 'true'
        this.editProfileForm.controls['forceOldEditor'].patchValue(forceOldEditor);
        const publicOptions = blogDetails.publicOptions;
        const askLevel = publicOptions.find((elem) => elem.optionName == "wafrn.public.asks")
        this.editProfileForm.controls['asksLevel'].patchValue(askLevel ? parseInt(askLevel.optionValue) : 2)
        const mutedWords = localStorage.getItem('mutedWords');
        this.editProfileForm.controls['mutedWords'].patchValue(mutedWords);
        this.loading = false;
      });
  }

  imgSelected(filePickerEvent: any) {
    if (filePickerEvent.target.files[0]) {
      this.img = filePickerEvent.target.files[0];
    }
  }

  async onSubmit() {
    this.loading = true;
    try {
      const res = await this.loginService.updateProfile(
        this.editProfileForm,
        this.img
      );

      this.messages.add({
        severity: 'success',
        summary: 'Your profile was updated!',
      });
    } catch (error) {
      this.messages.add({
        severity: 'error',
        summary: 'Something went wrong',
      });
      console.error(error);
    }
    this.loading = false;
  }

  emojiClicked(emoji: Emoji) {
    navigator.clipboard.writeText(' ' + emoji.name + ' ');
    this.messages.add({
      severity: 'success',
      summary: `The emoji ${emoji.name} was copied to your clipboard`,
    });
  }
}
