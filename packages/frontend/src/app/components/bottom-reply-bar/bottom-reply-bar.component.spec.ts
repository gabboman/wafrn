import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomReplyBarComponent } from './bottom-reply-bar.component';

describe('BottomReplyBarComponent', () => {
  let component: BottomReplyBarComponent;
  let fixture: ComponentFixture<BottomReplyBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomReplyBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BottomReplyBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
