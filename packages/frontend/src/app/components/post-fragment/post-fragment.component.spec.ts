import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostFragmentComponent } from './post-fragment.component';
import {LoginService} from "../../services/login.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";

describe('PostFragmentComponent', () => {
  let component: PostFragmentComponent;
  let fixture: ComponentFixture<PostFragmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PostFragmentComponent,
        HttpClientTestingModule,
      ],
      declarations: [

      ],
      providers: [
        {
          provide: LoginService,
          useValue: {
            getLoggedUserUUID: () => ''
          }
        }
      ],

    })
    .compileComponents();

    fixture = TestBed.createComponent(PostFragmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
