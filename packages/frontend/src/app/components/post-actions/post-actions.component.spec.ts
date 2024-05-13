import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostActionsComponent } from './post-actions.component';

describe('PostActionsComponent', () => {
  let component: PostActionsComponent;
  let fixture: ComponentFixture<PostActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostActionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PostActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
