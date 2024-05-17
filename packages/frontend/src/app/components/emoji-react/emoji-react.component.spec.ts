import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmojiReactComponent } from './emoji-react.component';

describe('EmojiReactComponent', () => {
  let component: EmojiReactComponent;
  let fixture: ComponentFixture<EmojiReactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmojiReactComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmojiReactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
