import { ComponentFixture, TestBed } from '@angular/core/testing'

import { PostFragmentComponent } from './post-fragment.component'
import { LoginService } from '../../services/login.service'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { WafrnMediaComponent } from '../wafrn-media/wafrn-media.component'
import { MockComponent, MockModule } from 'ng-mocks'
import { WafrnMediaModule } from '../wafrn-media/wafrn-media.module'
import { signal } from '@angular/core'
import { ProcessedPost } from 'src/app/interfaces/processed-post'

describe('PostFragmentComponent', () => {
  let component: PostFragmentComponent
  let fixture: ComponentFixture<PostFragmentComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      declarations: [PostFragmentComponent],
      providers: [
        provideHttpClientTesting(),
        {
          provide: LoginService,
          useValue: {
            getLoggedUserUUID: () => ''
          }
        }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(PostFragmentComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should process fragment blocks appropiately', () => {
    // Initial test, the simple one
    component.fragment = signal<ProcessedPost>({
      ask: undefined,
      createdAt: new Date(),
      descendents: [],
      emojiReactions: [],
      emojis: [],
      medias: [],
      mentionPost: [],
      notes: 0,
      parentId: '',
      privacy: 0,
      questionPoll: undefined,
      quotes: [],
      remotePostId: '',
      tags: [],
      title: '',
      updatedAt: new Date(),
      user: undefined,
      userId: '',
      userLikesPostRelations: [],
      id: '1',
      content: 'No medias attached and ![media-1] string',
      content_warning: ''
    })
    component.initializeContent()
    fixture.detectChanges()
    expect(JSON.stringify(component.wafrnFormattedContent)).toBe(
      JSON.stringify(['No medias attached and ![media-1] string'])
    )
    if (component.fragment) {
      component.fragment().content = 'post with one media ![media-1] and a second line'
      component.fragment().medias = [
        {
          id: '1',
          NSFW: false,
          description: '',
          url: '',
          external: false,
          mediaOrder: 0
        },
        {
          id: '2',
          NSFW: false,
          description: '',
          url: '',
          external: false,
          mediaOrder: 0
        }
      ]
      component.initializeContent()
      fixture.detectChanges()
      expect(JSON.stringify(component.wafrnFormattedContent)).toBe(
        JSON.stringify([
          'post with one media ',
          {
            id: '1',
            NSFW: false,
            description: '',
            url: '',
            external: false,
            mediaOrder: 0
          },
          ' and a second line'
        ])
      )
      component.fragment().content = 'start ![media-1] middle ![media-2] end'
      expect(JSON.stringify(component.seenMedia)).toBe(JSON.stringify([0]))
      component.initializeContent()
      fixture.detectChanges()
      expect(JSON.stringify(component.wafrnFormattedContent)).toBe(
        JSON.stringify([
          'start ',
          {
            id: '1',
            NSFW: false,
            description: '',
            url: '',
            external: false,
            mediaOrder: 0
          },
          ' middle ',
          {
            id: '2',
            NSFW: false,
            description: '',
            url: '',
            external: false,
            mediaOrder: 0
          },
          ' end'
        ])
      )
      component.fragment().content = 'start ![media-249] end'
      component.initializeContent()
      fixture.detectChanges()
      // acceptable compromise without more headaches. Your fault for making it like this lol
      expect(JSON.stringify(component.wafrnFormattedContent)).toBe(JSON.stringify(['start ', '![media-249]', ' end']))
    }
  })
})
