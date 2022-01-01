import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostFragmentComponent } from './post-fragment.component';

describe('PostFragmentComponent', () => {
  let component: PostFragmentComponent;
  let fixture: ComponentFixture<PostFragmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PostFragmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PostFragmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
