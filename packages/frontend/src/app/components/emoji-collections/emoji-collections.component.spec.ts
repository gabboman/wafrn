import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmojiCollectionsComponent } from './emoji-collections.component';

describe('EmojiCollectionsComponent', () => {
  let component: EmojiCollectionsComponent;
  let fixture: ComponentFixture<EmojiCollectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmojiCollectionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmojiCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
