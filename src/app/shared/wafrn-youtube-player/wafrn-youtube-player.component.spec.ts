import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WafrnYoutubePlayerComponent } from './wafrn-youtube-player.component';

describe('WafrnYoutubePlayerComponent', () => {
  let component: WafrnYoutubePlayerComponent;
  let fixture: ComponentFixture<WafrnYoutubePlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WafrnYoutubePlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WafrnYoutubePlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
