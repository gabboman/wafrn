import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmojiUploaderComponent } from './emoji-uploader.component';

describe('EmojiUploaderComponent', () => {
  let component: EmojiUploaderComponent;
  let fixture: ComponentFixture<EmojiUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmojiUploaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmojiUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
